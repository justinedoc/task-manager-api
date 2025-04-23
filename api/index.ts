import app from "./src/app.js";
import { connectToDb } from "@/configs/mongodb.js";
import { handle } from "@hono/node-server/vercel";

await connectToDb();

export default handle(app);
