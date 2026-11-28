import net from "node:net";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DEFAULT_HEALTH_CHECK_TIMEOUT_MS = 2_000;

interface ProbeSocketOptions {
  host: string[];
  port: number[];
  path?: string | false;
}

type PostgresOptionsWithSocket = postgres.Options<Record<string, never>> & {
  socket?: (options: ProbeSocketOptions) => Promise<net.Socket>;
};

interface ProbeHandle {
  client: ReturnType<typeof postgres>;
  database: ReturnType<typeof drizzle>;
  sockets: Set<net.Socket>;
  disposed: boolean;
}

function connectProbeSocket(
  options: ProbeSocketOptions,
  sockets: Set<net.Socket>,
  isDisposed: () => boolean,
): Promise<net.Socket> {
  if (isDisposed()) {
    return Promise.reject(new Error("Database probe client is disposed"));
  }

  const socket = options.path
    ? net.createConnection(options.path)
    : net.createConnection(
        options.port[0] ?? 5432,
        options.host[0] ?? "localhost",
      );

  sockets.add(socket);
  socket.once("close", () => {
    sockets.delete(socket);
  });

  return new Promise<net.Socket>((resolve, reject) => {
    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    const onConnect = () => {
      cleanup();
      if (isDisposed()) {
        socket.destroy();
        reject(new Error("Database probe client is disposed"));
        return;
      }
      resolve(socket);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Database probe socket closed before connecting"));
    };

    socket.once("connect", onConnect);
    socket.once("error", onError);
    socket.once("close", onClose);
  });
}

function destroySocket(socket: net.Socket): Promise<void> {
  if (socket.closed) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    socket.once("close", () => resolve());
    socket.destroy();
  });
}

export function createPostgres(
  databaseUrl: string,
  {
    healthCheckTimeoutMs = DEFAULT_HEALTH_CHECK_TIMEOUT_MS,
  }: { healthCheckTimeoutMs?: number } = {},
) {
  let probe: ProbeHandle | undefined;
  let pendingCheck: Promise<void> | undefined;
  const pendingDisposals = new Set<Promise<void>>();
  let closed = false;

  function disposeProbe(target: ProbeHandle | undefined): Promise<void> {
    if (!target || target.disposed) {
      return Promise.resolve();
    }
    target.disposed = true;
    if (probe === target) {
      probe = undefined;
    }

    const trackedSockets = [...target.sockets];
    const disposal = Promise.all([
      ...trackedSockets.map(destroySocket),
      target.client.end({ timeout: 0 }).catch(() => {}),
    ])
      .then(() => {})
      .finally(() => {
        pendingDisposals.delete(disposal);
      });
    pendingDisposals.add(disposal);
    return disposal;
  }

  function getOrCreateProbe(): ProbeHandle {
    if (probe && !probe.disposed) {
      return probe;
    }

    const sockets = new Set<net.Socket>();
    const connectTimeoutSeconds = Math.max(
      1,
      Math.ceil(healthCheckTimeoutMs / 1_000),
    );
    const handle: ProbeHandle = {
      client: undefined as unknown as ReturnType<typeof postgres>,
      database: undefined as unknown as ReturnType<typeof drizzle>,
      sockets,
      disposed: false,
    };

    const options: PostgresOptionsWithSocket = {
      max: 1,
      connect_timeout: connectTimeoutSeconds,
      fetch_types: false,
      connection: { statement_timeout: healthCheckTimeoutMs },
      socket: (socketOptions) =>
        connectProbeSocket(
          socketOptions,
          sockets,
          () => handle.disposed || closed,
        ),
    };

    handle.client = postgres(databaseUrl, options);
    handle.database = drizzle(handle.client);
    probe = handle;
    return handle;
  }

  function runHealthProbe(): Promise<void> {
    if (closed) {
      return Promise.reject(new Error("Database client is closed"));
    }

    const activeProbe = getOrCreateProbe();

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        void disposeProbe(activeProbe).finally(() => {
          reject(new Error("Database health check timed out"));
        });
      }, healthCheckTimeoutMs);
      timer.unref();

      activeProbe.database.execute(sql`select 1`).then(
        () => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          resolve();
        },
        (error) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          void disposeProbe(activeProbe).finally(() => {
            reject(error);
          });
        },
      );
    });
  }

  return {
    checkConnection() {
      pendingCheck ??= runHealthProbe().finally(() => {
        pendingCheck = undefined;
      });
      return pendingCheck;
    },
    async close() {
      closed = true;
      await Promise.all([disposeProbe(probe), ...pendingDisposals]);
    },
  };
}
