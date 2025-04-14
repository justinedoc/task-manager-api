import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";

import { ENV } from "@/configs/env-config.js";
import logger from "@/utils/logger.js";

const app = new Hono().basePath("/api");

const serverConfig = {
  fetch: app.fetch,
  port: ENV.PORT,
};

serve(serverConfig, (info) => {
  logger.info(`✅ Server is running on http://localhost:${info.port}`);
});

export default app;
