import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";

import { ENV } from "@/configs/env-config.js";
import logger from "@/utils/logger.js";
import { connectToDb } from "@/configs/mongodb.js";

const app = new Hono().basePath("/api");

const serverConfig = {
  fetch: app.fetch,
  port: ENV.PORT,
};

serve(serverConfig, async (info) => {
  logger.info(`✅ Server is running on http://localhost:${info.port}`);
  await connectToDb();
});

export default app;
