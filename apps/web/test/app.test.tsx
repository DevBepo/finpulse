import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../src/app.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("shows the API and database as online after fetching live health", async () => {
  vi.stubGlobal("fetch", async (url: string) => {
    expect(url).toBe("/api/health");
    return Response.json({ status: "ok", database: "up" });
  });

  render(<App />);

  expect(await screen.findByText("Connected")).toBeDefined();
  expect(screen.getByText("Online")).toBeDefined();
});

it("shows a disconnected database when the API returns a health response with HTTP 503", async () => {
  vi.stubGlobal("fetch", async () =>
    Response.json({ status: "unavailable", database: "down" }, { status: 503 }),
  );

  render(<App />);

  expect(await screen.findByText("Disconnected")).toBeDefined();
  expect(screen.getByText("Online")).toBeDefined();
});

it("reports an unreachable API and unknown database state when the request fails", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new TypeError("Failed to fetch");
  });

  render(<App />);

  expect(await screen.findByText("Unreachable")).toBeDefined();
  expect(screen.getByText("Unknown")).toBeDefined();
});

it("does not show an online status when the HTTP status contradicts the payload", async () => {
  vi.stubGlobal("fetch", async () =>
    Response.json({ status: "ok", database: "up" }, { status: 503 }),
  );

  render(<App />);

  expect(await screen.findByText("Unreachable")).toBeDefined();
  expect(screen.getByText("Unknown")).toBeDefined();
});

it("reports an unreachable API when the health request times out", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      }),
  );

  render(<App />);
  expect(screen.getAllByText("Checking…")).toHaveLength(2);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5_000);
  });

  expect(screen.getByText("Unreachable")).toBeDefined();
  expect(screen.getByText("Unknown")).toBeDefined();
});
