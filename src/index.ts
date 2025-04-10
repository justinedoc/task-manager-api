import app from "@/app.js";
import { logger } from "hono/logger";
import auth from "@/controllers/auth.js";
import { cors } from "hono/cors";

const ROUTE_PREFIX = "/api/v1";

app.use(logger());

app.use(cors({ origin: "*" }));

app.get(`${ROUTE_PREFIX}/health-check`, (c) => {
  return c.json({ message: "OK" }, 200);
});

app.route(`${ROUTE_PREFIX}/auth`, auth);

app.notFound((c) => {
  return c.json({ message: `Route not found - ${c.req.path}` }, 404);
});
