import app from "@/app.js";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import serveEmojiFavicon from "stoker/middlewares/serve-emoji-favicon";
import onError from "stoker/middlewares/on-error";
import authRoutes from "@/controllers/auth-controller.js";
import userRoutes from "@/controllers/user-controller.js";

const VERSION_ONE = "/v1";

app.use(serveEmojiFavicon("🔥"));
app.use(logger());
app.use(cors({ origin: "*", credentials: true }));

app.get(`/health-check`, (c) => {
  return c.json({ message: "OK" }, 200);
});

app.route(`${VERSION_ONE}/auth`, authRoutes);
app.route(`${VERSION_ONE}/user`, userRoutes);

app.notFound((c) => {
  return c.json({ message: `Route not found - ${c.req.path}` }, 404);
});

app.onError(onError);
