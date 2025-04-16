import { Hono } from "hono";
import "dotenv/config";

const app = new Hono().basePath("/api");

export default app;
