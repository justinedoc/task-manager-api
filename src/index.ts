import app from "@/app.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";
import { OK } from "stoker/http-status-codes";

import { onError } from "@/middlewares/on-error.js";
import authRoutes from "@/routes/auth-routes.js";
import userRoutes from "@/routes/user-routes.js";
import taskRoutes from "@/routes/task-routes.js";
import refreshRoute from "@/routes/refresh-route.js";

app.use(serveEmojiFavicon("🔥"));
app.use(cors({ origin: "*", credentials: true }));
app.use(compress());
app.use(secureHeaders());
app.use(logger());
app.onError(onError);

app.get(`/health-check`, (c) => {
  return c.json(
    {
      status: "OK",
      uptime: process.uptime(),
      message: "Server is running",
    },
    OK
  );
});

app.route("/v1", authRoutes);
app.route("/v1", userRoutes);
app.route("/v1", taskRoutes);
app.route("/v1", refreshRoute);

app.notFound((c) => {
  return c.json({ message: `Route not found - ${c.req.path}` }, 404);
});
