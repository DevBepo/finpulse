import { createApp } from "./app.js";
import { readConfig } from "./config.js";

const config = readConfig(process.env);
const app = createApp({ databaseUrl: config.databaseUrl, logger: true });

let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  void app.close().catch((error: unknown) => {
    app.log.error(
      {
        reason:
          error instanceof Error ? error.message : "Unknown shutdown error",
      },
      "Failed to close FinPulse API cleanly",
    );
    process.exitCode = 1;
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await app.listen({ host: "127.0.0.1", port: config.port });
