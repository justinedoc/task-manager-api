import { connectToDb } from "@/configs/mongodb.js";
import { handle } from "@hono/node-server/vercel";

// @ts-expect-error: Importing app from a compiled JavaScript file

import app from "../dist/src/app.js";
await connectToDb();

export default handle(app);
