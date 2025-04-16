import app from "../src/app.js";
import { connectToDb } from "@/configs/mongodb.js";
import { handle } from "hono/vercel";

await connectToDb();

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;
