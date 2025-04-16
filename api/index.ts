import app from "@/app.js";
import { connectToDb } from "@/configs/mongodb.js";
import { handle } from "hono/vercel";

await connectToDb();

export const config = {
  runtime: "node",
};

export default handle(app);
