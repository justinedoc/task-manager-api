import { zValidator } from "@hono/zod-validator";
import logger from "@/utils/logger.js";
import { getRefreshCookie, setRefreshCookie } from "@/configs/cookie-config.js";
import { CONFLICT, CREATED, FORBIDDEN, OK } from "stoker/http-status-codes";
import { formatAuthSuccessResponse } from "@/utils/format-auth-res.js";
import { AuthError } from "@/errors/auth-error.js";
import { adminProtected } from "@/middlewares/admin-protected.js";
import {
  authMiddleware,
  isSelfOrAdmin,
} from "@/middlewares/auth-middleware.js";
import adminService from "@/services/admin-services.js";
import type { AppBindings } from "@/types/hono-types.js";
import { Hono } from "hono";
import {
  AdminZodSchema,
  GetAdminByIdZodSchema,
} from "@/schemas/admin-schema.js";
import { UserLoginZodSchema } from "@/schemas/user-schema.js";
import { getCacheKey, getCacheOrFetch } from "@/utils/get-cache.js";
import { unauthorizedRes } from "@/routes/user-routes.js";

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

// get admin by ID
app.get("/:id", zValidator("param", GetAdminByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");
  const cacheKey = getCacheKey("admin", { userId });

  if (!isSelfOrAdmin({ userId, id, role })) {
    throw new AuthError(unauthorizedRes.message, FORBIDDEN);
  }

  const user = await getCacheOrFetch(
    cacheKey,
    async () => await adminService.findById(userId)
  );

  return c.json(
    {
      success: true,
      message: "Admin fetched successfully",
      data: { user },
    },
    OK
  );
});

// app.patch(
//   "/reset-password",
//   zValidator("json", UserPasswordUpdateZodSchema),
//   async (c) => {
//     const { id: userId } = c.get("user");
//     const { newPassword, oldPassword } = c.req.valid("json");

//     const user = await userService.updatePassword(
//       userId,
//       newPassword,
//       oldPassword
//     );

//     return c.json(
//       {
//         success: true,
//         message: "Password reset successfully",
//         data: { user },
//       },
//       OK
//     );
//   }
// );

export default app;
