import { randomUUID } from "node:crypto";
import net from "node:net";
import { healthResponseSchema } from "@finpulse/contracts";
import { expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";

function testDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Set TEST_DATABASE_URL and start PostgreSQL with Docker Compose",
    );
  }
  const parsed = URL.parse(url);
  if (
    !parsed ||
    (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:")
  ) {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL");
  }
  const hasDatabaseOverride = [...parsed.searchParams.keys()].some((key) => {
    const normalized = key.toLowerCase();
    return normalized === "database" || normalized === "db";
  });
  if (hasDatabaseOverride || !parsed.pathname.endsWith("_test")) {
    throw new Error(
      "TEST_DATABASE_URL must target a dedicated *_test database without query overrides",
    );
  }
  return parsed;
}

it("reports healthy when the API can query the PostgreSQL test database", async () => {
  const app = createApp({ databaseUrl: testDatabaseUrl().href });

  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "ok",
      database: "up",
    });
  } finally {
    await app.close();
  }
});

it("returns the shared unavailable response when PostgreSQL rejects the connection", async () => {
  const databaseUrl = testDatabaseUrl();
  databaseUrl.pathname = `/missing_${randomUUID()}`;
  const app = createApp({ databaseUrl: databaseUrl.href });

  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(503);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(healthResponseSchema.parse(response.json())).toEqual({
      status: "unavailable",
      database: "down",
    });
  } finally {
    await app.close();
  }
});

it("destroys local timed-out probe sockets during half-open stalls and recovers when PostgreSQL responds", async () => {
  const targetUrl = testDatabaseUrl();
  const targetPort = Number(targetUrl.port || "5432");
  let stalled = false;
  let proxyConnections = 0;
  const openSockets = new Set<net.Socket>();

  const proxy = net.createServer({ allowHalfOpen: true }, (socket) => {
    proxyConnections += 1;
    openSockets.add(socket);
    socket.once("close", () => {
      openSockets.delete(socket);
    });
    socket.on("end", () => {
      // Keep the server half open while stalled to ensure the client destroys its own local socket.
      if (!stalled) {
        socket.end();
      }
    });

    const upstream = net.connect(targetPort, targetUrl.hostname);
    openSockets.add(upstream);
    upstream.once("close", () => openSockets.delete(upstream));

    socket.on("data", (chunk) => {
      if (!stalled) {
        upstream.write(chunk);
      }
    });
    upstream.on("data", (chunk) => {
      if (!stalled) {
        socket.write(chunk);
      }
    });
    socket.once("error", () => upstream.destroy());
    upstream.once("error", () => socket.destroy());
  });

  await new Promise<void>((resolve) => {
    proxy.listen(0, "127.0.0.1", resolve);
  });

  const address = proxy.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP proxy address");
  }

  const proxyUrl = new URL(targetUrl.href);
  proxyUrl.hostname = "127.0.0.1";
  proxyUrl.port = String(address.port);

  const clientSockets: net.Socket[] = [];
  const originalCreateConnection = net.createConnection;
  const createConnectionSpy = vi
    .spyOn(net, "createConnection")
    .mockImplementation(((...args: Parameters<typeof net.createConnection>) => {
      const created = Reflect.apply(
        originalCreateConnection,
        net,
        args,
      ) as net.Socket;
      clientSockets.push(created);
      return created;
    }) as typeof net.createConnection);

  const app = createApp({
    databaseUrl: proxyUrl.href,
    healthCheckTimeoutMs: 1_000,
  });

  try {
    const initial = await app.inject({ method: "GET", url: "/api/health" });
    expect(initial.statusCode).toBe(200);
    expect(proxyConnections).toBe(1);
    expect(clientSockets).toHaveLength(1);
    expect(clientSockets[0]?.destroyed).toBe(false);

    stalled = true;
    const [first, second] = await Promise.all([
      app.inject({ method: "GET", url: "/api/health" }),
      app.inject({ method: "GET", url: "/api/health" }),
    ]);

    expect(first.statusCode).toBe(503);
    expect(second.statusCode).toBe(503);
    expect(healthResponseSchema.parse(first.json())).toEqual({
      status: "unavailable",
      database: "down",
    });
    expect(proxyConnections).toBe(1);
    expect(clientSockets).toHaveLength(1);
    expect(clientSockets[0]?.destroyed).toBe(true);
    expect(clientSockets[0]?.closed).toBe(true);

    const repeatedStall = await app.inject({
      method: "GET",
      url: "/api/health",
    });
    expect(repeatedStall.statusCode).toBe(503);
    expect(clientSockets).toHaveLength(2);
    expect(clientSockets[1]?.destroyed).toBe(true);
    expect(clientSockets[1]?.closed).toBe(true);

    stalled = false;
    const recovered = await app.inject({ method: "GET", url: "/api/health" });

    expect(recovered.statusCode).toBe(200);
    expect(healthResponseSchema.parse(recovered.json())).toEqual({
      status: "ok",
      database: "up",
    });
    expect(clientSockets).toHaveLength(3);
    expect(clientSockets[2]?.destroyed).toBe(false);
  } finally {
    createConnectionSpy.mockRestore();
    await app.close();
    for (const socket of openSockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
  }
});

it("recovers on the first request after a refused PostgreSQL connection comes back", async () => {
  const targetUrl = testDatabaseUrl();
  const targetPort = Number(targetUrl.port || "5432");
  const openSockets = new Set<net.Socket>();

  const portProbe = net.createServer();
  await new Promise<void>((resolve) => {
    portProbe.listen(0, "127.0.0.1", resolve);
  });
  const reservedAddress = portProbe.address();
  if (!reservedAddress || typeof reservedAddress === "string") {
    throw new Error("Expected ephemeral TCP port");
  }
  const { port } = reservedAddress;
  await new Promise<void>((resolve) => portProbe.close(() => resolve()));

  const proxyUrl = new URL(targetUrl.href);
  proxyUrl.hostname = "127.0.0.1";
  proxyUrl.port = String(port);

  const app = createApp({
    databaseUrl: proxyUrl.href,
    healthCheckTimeoutMs: 1_000,
  });

  let proxy: net.Server | undefined;

  try {
    const refused = await app.inject({ method: "GET", url: "/api/health" });
    expect(refused.statusCode).toBe(503);
    expect(healthResponseSchema.parse(refused.json())).toEqual({
      status: "unavailable",
      database: "down",
    });

    proxy = net.createServer((socket) => {
      openSockets.add(socket);
      socket.once("close", () => openSockets.delete(socket));
      const upstream = net.connect(targetPort, targetUrl.hostname);
      openSockets.add(upstream);
      upstream.once("close", () => openSockets.delete(upstream));
      socket.pipe(upstream).pipe(socket);
      socket.once("error", () => upstream.destroy());
      upstream.once("error", () => socket.destroy());
    });
    await new Promise<void>((resolve) => {
      proxy?.listen(port, "127.0.0.1", resolve);
    });

    const recovered = await app.inject({ method: "GET", url: "/api/health" });
    expect(recovered.statusCode).toBe(200);
    expect(healthResponseSchema.parse(recovered.json())).toEqual({
      status: "ok",
      database: "up",
    });
  } finally {
    await app.close();
    for (const socket of openSockets) {
      socket.destroy();
    }
    if (proxy) {
      await new Promise<void>((resolve) => proxy?.close(() => resolve()));
    }
  }
});
