import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import userService from "@/services/user-service.js";
import logger from "@/utils/logger.js";
import {
  deleteRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from "@/configs/cookie-config.js";
import { CONFLICT, CREATED, OK } from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/format-auth-res.js";
import { UserLoginZodSchema, UserZodSchema } from "@/schemas/user-schema.js";
import { AuthError } from "@/errors/auth-error.js";
import { decode } from "hono/jwt";
import { selectService } from "@/utils/select-service.js";
import type { Roles } from "@/utils/role-utils.js";

const app = new Hono().basePath("/auth");

// register users
app.post(
  "/register",
  zValidator("json", UserZodSchema.omit({ role: true, refreshToken: true })),
  async (c) => {
    const userDetails = c.req.valid("json");

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

    logger.info(`User ${user.firstname} has been registered`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Registration successful", user),
        accessToken,
      },
      CREATED
    );
  }
);

//login users
app.post("/login", zValidator("json", UserLoginZodSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const refCookie = await getRefreshCookie(c);

  if (refCookie) throw new AuthError("Already logged in", CONFLICT);

  const user = await userService.findByEmail(email);

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
});

app.post("/logout", async (c) => {
  const refreshToken = await getRefreshCookie(c);

  if (refreshToken) {
    const {
      payload: { role },
    } = decode(refreshToken);

    const service = selectService(role as Roles);
    const user = await service.getByRefreshToken(refreshToken);

    if (user)
      await service.clearRefreshToken(user._id.toString(), refreshToken);
  }

  deleteRefreshCookie(c);
  logger.info(`A user logged out`);
  return c.json({ success: true, message: "Logout successful" }, OK);
});

export default app;
