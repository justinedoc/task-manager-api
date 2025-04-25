import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import { setRefreshCookie } from "@/configs/cookie-config.js";
import {
  CONFLICT,
  CREATED,
  INTERNAL_SERVER_ERROR,
  OK,
} from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/format-auth-res.js";
import { UserLoginZodSchema, UserZodSchema } from "@/schemas/user-schema.js";
import { AuthError } from "@/errors/auth-error.js";

const app = new Hono().basePath("/auth");

// register users
app.post("/register", zValidator("json", UserZodSchema), async (c) => {
  const userDetails = c.req.valid("json");

  try {
    const userExists = await userService.exists(userDetails.email);

    if (userExists) throw new AuthError("User already exists", CONFLICT);

    const hashedPassword = await userService.hashPassword(userDetails.password);

    const user = await userService.create({
      ...userDetails,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    const updatedUser = await userService.updateRefreshToken(
      user._id,
      refreshToken
    );

    if (!updatedUser) throw new AuthError("Failed to update refresh token");

    await setRefreshCookie(c, refreshToken);

    logger.info(`User ${user.firstname} has been added to the database`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Registration successful", user),
        accessToken,
      },
      CREATED
    );
  } catch (err) {
    if (err instanceof AuthError) {
      logger.warn(err.message);
      return c.json({ success: false, message: err.message }, err.status);
    }

    logger.error(err, "Unexpected error in refresh");
    return c.json(
      { success: false, message: "An Unexpected error occured" },
      INTERNAL_SERVER_ERROR
    );
  }
});

//login users
app.post("/login", zValidator("json", UserLoginZodSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const user = await userService.findByEmail(email);

    if (!user) throw new AuthError("Incorrect credentials");

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) throw new AuthError("Incorrect credentials");

    const { accessToken, refreshToken } = await userService.getAuthTokens(
      user._id
    );

    const updatedUser = await userService.updateRefreshToken(
      user._id,
      refreshToken
    );

    if (!updatedUser) throw new AuthError("Failed to update refresh token");

    await setRefreshCookie(c, refreshToken);

    logger.info(`User ${await user.getFullname()} has been logged in`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Login Successful", user),
        accessToken,
      },
      OK
    );
  } catch (error) {
    if (error instanceof AuthError) {
      logger.warn(error.message);
      return c.json({ success: false, message: error.message }, error.status);
    }

    logger.error(error, "Unexpected error in refresh");
    return c.json(
      { success: false, message: "An Unexpected error occured" },
      INTERNAL_SERVER_ERROR
    );
  }
});

export default app;
