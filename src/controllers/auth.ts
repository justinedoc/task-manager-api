import { Hono } from "hono";

const app = new Hono();

app.get("/register", (c) => {
  return c.json({ message: "Register" });
});

export default app;
