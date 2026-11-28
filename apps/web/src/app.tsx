import {
  type HealthResponse,
  healthResponseSchema,
  healthStatusCodes,
} from "@finpulse/contracts";
import { useEffect, useState } from "react";

type HealthState = HealthResponse["status"] | "checking" | "unreachable";

const HEALTH_REQUEST_TIMEOUT_MS = 5_000;

const healthLabels = {
  checking: { api: "Checking…", database: "Checking…" },
  ok: { api: "Online", database: "Connected" },
  unavailable: { api: "Online", database: "Disconnected" },
  unreachable: { api: "Unreachable", database: "Unknown" },
};

export function App() {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_REQUEST_TIMEOUT_MS,
    );

    void fetch("/api/health", { signal: controller.signal })
      .then(async (response) => {
        const { status } = healthResponseSchema.parse(await response.json());
        if (response.status !== healthStatusCodes[status]) {
          throw new Error("Unexpected health response");
        }
        if (active) {
          setHealth(status);
        }
      })
      .catch(() => {
        if (active) {
          setHealth("unreachable");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const { api, database } = healthLabels[health];

  return (
    <main>
      <h1>FinPulse</h1>
      <section aria-labelledby="health-heading" data-health={health}>
        <h2 id="health-heading">System health</h2>
        <dl aria-live="polite">
          <div>
            <dt>API</dt>
            <dd className="api-status">{api}</dd>
          </div>
          <div>
            <dt>PostgreSQL</dt>
            <dd className="database-status">{database}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
