import logger from "@/utils/logger.js";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  ENV: z.enum(["development", "production"]),
  PORT: z.string().default("4000").transform(Number),
  MONGODB_URI: z.string().url({ message: "DB_URL must be a valid URL" }),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  COOKIE_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error(parsedEnv.error.format(), "❌ Invalid environment variables: ", );
  process.exit(1);
}

export const ENV = parsedEnv.data;
