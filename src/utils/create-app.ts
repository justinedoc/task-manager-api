import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";

import { onError } from "@/middlewares/on-error.js";
import { defaultHook } from "stoker/openapi";
import { connectToDb } from "@/configs/mongodb.js";

export function createRouter() {
  return new OpenAPIHono({
    strict: false,
    defaultHook,
  }).basePath("/api");
}

export default function createApp() {
  const app = createRouter();
  app.use(serveEmojiFavicon("🔥"));
  app.use(cors({ origin: "*", credentials: true }));
  app.use(compress());
  app.use(secureHeaders());

  app.use("*", async (c, next) => {
    await connectToDb();
    return next();
  });

  app.use(logger());
  app.onError(onError);

  return app;
}
