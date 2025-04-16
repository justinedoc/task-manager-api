import { ENV } from "@/configs/env-config.js";
import logger from "@/utils/logger.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

const app = new Hono();

/**
 * Middleware for JWT Authentication.
 */
app.use(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { success: false, message: "Invalid Authorization Header" },
      403
    );
  }

  // Extract the token from the "Bearer <token>" format.
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using the secret from environment variables.
    await verify(token, ENV.ACCESS_TOKEN_SECRET);
    // Continue to the next middleware or route handler.
    return next();
  } catch (err) {
    // Log the error with more context.
    logger.error("Token verification failed:", err);
    return c.json(
      {
        success: false,
        message: "Authentication failed",
        error: err instanceof Error && err.message,
      },
      500
    );
  }
});

/**
 * Schema for validating the user ID in the request parameter.
 */
const GetUserByIdZodSchema = z.object({
  id: z.string().refine(isValidObjectId, { message: "Invalid ID" }),
});

/**
 * GET endpoint to retrieve user by ID.
 */
app.get("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  // The validated parameter is fetched using the zValidator helper.
  const { id } = c.req.valid("param");

  logger.info(`Fetching user with ID: ${id}`);

  // (Assume further logic is added here to actually retrieve and return the user data)
  return c.json({ message: "Ok" }, 200);
});

export default app;
