import app from "@/app.js";

import { ENV } from "@/configs/env-config.js";
import * as pino from "@/utils/logger.js";
import { connectToDb } from "@/configs/mongodb.js";

import { serve } from "@hono/node-server";

const serverConfig = {
  fetch: app.fetch,
  port: ENV.PORT,
};

async function bootstrap() {
  await connectToDb();
  serve(serverConfig, (info) => {
    pino.default.info(`✅ Server is running on http://localhost:${info.port}`);
  });
}

bootstrap().catch((err) => {
  pino.default.error("🔴 Failed to start server:", err);
  process.exit(1);
});
