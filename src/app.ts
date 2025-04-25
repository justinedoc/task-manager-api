import { Hono } from "hono";
import "dotenv/config";
import { ENV } from "@/configs/env-config.js";
import * as pino from "@/utils/logger.js";
import { connectToDb } from "@/configs/mongodb.js";
import { serve } from "@hono/node-server";

const app = new Hono({
  strict: false,
}).basePath("/api");

const serverConfig = {
  fetch: app.fetch,
  port: ENV.PORT,
};

serve(serverConfig, async (info) => {
  pino.default.info(`✅ Server is running on http://localhost:${info.port}`);
  await connectToDb();
});

export default app;
