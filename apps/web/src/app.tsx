import {
  type HealthResponse,
  healthResponseSchema,
  healthStatusCodes,
} from "@finpulse/contracts";
import { useEffect, useState } from "react";

type HealthState = HealthResponse["status"] | "checking" | "unreachable";

const healthLabels = {
  checking: { api: "Checking…", database: "Checking…" },
  ok: { api: "Online", database: "Connected" },
  unavailable: { api: "Online", database: "Disconnected" },
  unreachable: { api: "Unreachable", database: "Unknown" },
};

export function App() {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    void fetch("/api/health", { signal })
      .then(async (response) => {
        const { status } = healthResponseSchema.parse(await response.json());
        if (response.status !== healthStatusCodes[status]) {
          throw new Error("Unexpected health response");
        }
        if (!signal.aborted) {
          setHealth(status);
        }
      })
      .catch(() => {
        if (!signal.aborted) {
          setHealth("unreachable");
        }
      });

    return () => controller.abort();
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
