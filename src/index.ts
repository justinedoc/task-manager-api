import app from "@/app.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";
import authRoutes from "@/routes/auth-routes.js";
import userRoutes from "@/routes/user-routes.js";
import taskRoutes from "@/routes/task-routes.js";
import { onError } from "@/middlewares/on-error.js";

const VERSION_ONE = "/v1";

app.use(serveEmojiFavicon("🔥"));
app.use(logger());
app.use(cors({ origin: "*", credentials: true }));

app.get(`/health-check`, (c) => {
  return c.json({ message: "OK" }, 200);
});

app.route(`${VERSION_ONE}/auth`, authRoutes);
app.route(`${VERSION_ONE}/user`, userRoutes);
app.route(`${VERSION_ONE}/tasks`, taskRoutes);

app.notFound((c) => {
  return c.json({ message: `Route not found - ${c.req.path}` }, 404);
});

app.onError(onError);
