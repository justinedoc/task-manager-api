import { zValidator } from "@hono/zod-validator";
import logger from "@/utils/logger.js";
import {
  deleteRefreshCookie,
  getRefreshCookie,
  setRefreshCookie,
} from "@/configs/cookie-config.js";
import { CONFLICT, CREATED, OK } from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/format-auth-res.js";
import { AuthError } from "@/errors/auth-error.js";
import { decode } from "hono/jwt";
import { adminProtected } from "@/middlewares/admin-protected.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import adminService from "@/services/admin-services.js";
import type { AppBindings } from "@/types/hono-types.js";
import { Hono } from "hono";
import { AdminZodSchema } from "@/schemas/admin-schema.js";
import { UserLoginZodSchema } from "@/schemas/user-schema.js";

const app = new Hono<AppBindings>().basePath("/admin");

// login admins
app.post("/login", zValidator("json", UserLoginZodSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const refCookie = await getRefreshCookie(c);

  if (refCookie) throw new AuthError("Already logged in", CONFLICT);

  const admin = await adminService.findByEmail(email);

  const isPasswordMatch = await admin.comparePassword(password);

  if (!isPasswordMatch) throw new AuthError("Incorrect credentials");

  const { accessToken, refreshToken } = await adminService.getAuthTokens(
    admin._id
  );

  const updatedAdmin = await adminService.updateRefreshToken(
    admin._id,
    refreshToken
  );

  if (!updatedAdmin) throw new AuthError("Failed to update refresh token");

  await setRefreshCookie(c, refreshToken);

  logger.info(`Admin ${await admin.getFullname()} has been logged in`);

  return c.json(
    {
      ...formatAuthSuccessResponse("Login Successful", admin),
      accessToken,
    },
    OK
  );
});

// logout admins
app.post("/logout", async (c) => {
  const refreshToken = await getRefreshCookie(c);

  if (refreshToken) {
    const {
      payload: { id },
    } = decode(refreshToken);

    await adminService.clearRefreshToken(String(id), refreshToken);
  }

  deleteRefreshCookie(c);
  logger.info(`Admin logged out`);
  return c.json({ success: true, message: "Logout successful" }, OK);
});

/* 

////// PROTECTED ROUTES  /////

*/

app.use(authMiddleware);
app.use(adminProtected);

// register admins
app.post(
  "/register",
  zValidator("json", AdminZodSchema.omit({ role: true, refreshToken: true })),
  async (c) => {
    const adminDetails = c.req.valid("json");

    const adminExists = await adminService.exists(adminDetails.email);

    if (adminExists) throw new AuthError("Admin already exists", CONFLICT);

    const hashedPassword = await adminService.hashPassword(
      adminDetails.password
    );

    const admin = await adminService.create({
      ...adminDetails,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await adminService.getAuthTokens(
      admin._id
    );

    const updatedAdmin = await adminService.updateRefreshToken(
      admin._id,
      refreshToken
    );

    if (!updatedAdmin) throw new AuthError("Failed to update refresh token");

    await setRefreshCookie(c, refreshToken);

    logger.info(`Admin ${admin.firstname} has been registered`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Registration successful", admin),
        accessToken,
      },
      CREATED
    );
  }
);

export default app;
