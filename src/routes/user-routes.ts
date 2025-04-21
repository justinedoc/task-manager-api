import { setRefreshCookie } from "@/configs/cookie-config.js";
import {
  authMiddleware,
  isSelfOrAdmin,
} from "@/middlewares/auth-middleware.js";
import User from "@/models/user-model.js";
import {
  GetUserByIdZodSchema,
  UpdateUserZodSchema,
  UserZodSchema,
} from "@/schemas/user-schema.js";
import userService from "@/services/user-service.js";
import type { Variables } from "@/types/hono-types.js";
import { formatAuthSuccessResponse } from "@/utils/formatAuthResponse.js";
import logger from "@/utils/logger.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  CONFLICT,
  CREATED,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
} from "stoker/http-status-codes";

const unauthorizedRes = {
  success: false,
  message: "You are not authorized to view this user",
};

const app = new Hono<{
  Variables: Variables;
}>();

app.use(authMiddleware);

// register users
app.post("/register", zValidator("json", UserZodSchema), async (c) => {
  const userDetails = c.req.valid("json");

  try {
    const userExists = await userService.exists(userDetails.email);

    if (userExists) {
      return c.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        CONFLICT
      );
    }

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

    if (!updatedUser) {
      logger.error("Failed to update refresh token");
    }

    await setRefreshCookie(c, refreshToken);

    logger.trace(`User ${user.firstname} has been added to the database`);

    return c.json(
      {
        ...formatAuthSuccessResponse("Registration successful", user),
        accessToken,
      },
      CREATED
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : error,
      "An error occurred while registering user: "
    );

    return c.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

// get user by id
app.get("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");

  if (!isSelfOrAdmin({ userId, id, role })) {
    return c.json(unauthorizedRes, FORBIDDEN);
  }

  try {
    const user = await User.findById(id).select(
      "-refreshToken -comparePassword -__v -password"
    );

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        message: "User fetched successfully",
        data: { user },
      },
      OK
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "Unknown error occurred",
      "Error fetching user by ID"
    );

    return c.json(
      {
        success: false,
        message: "Error fetching user",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

// update user
app.patch(
  "/:id",
  zValidator("param", UpdateUserZodSchema.pick({ id: true })),
  zValidator("json", UpdateUserZodSchema.omit({ id: true })),
  async (c) => {
    const { id: userId, role } = c.get("user");
    const { id } = c.req.valid("param");
    const { data } = c.req.valid("json");

    if (!isSelfOrAdmin({ userId, id, role })) {
      return c.json(unauthorizedRes, FORBIDDEN);
    }

    try {
      const user = await User.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).select("-password -refreshToken -__v");

      if (!user) {
        return c.json(
          {
            success: false,
            message: "User not found",
          },
          NOT_FOUND
        );
      }

      return c.json(
        {
          success: true,
          message: "User updated successfully",
          data: { user },
        },
        OK
      );
    } catch (error) {
      logger.error(
        error instanceof Error ? error.message : "Unknown error occurred",
        "Error updating user"
      );

      return c.json(
        {
          success: false,
          message: "Error updating user",
        },
        INTERNAL_SERVER_ERROR
      );
    }
  }
);

app.delete("/:id", zValidator("param", GetUserByIdZodSchema), async (c) => {
  const { id } = c.req.valid("param");
  const { id: userId, role } = c.get("user");

  if (!isSelfOrAdmin({ userId, id, role })) {
    return c.json(unauthorizedRes, FORBIDDEN);
  }

  try {
    const user = await User.findByIdAndDelete(id).select(
      "-refreshToken -comparePassword -__v -password"
    );

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        NOT_FOUND
      );
    }

    return c.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      OK
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "Unknown error occurred",
      "Error deleting user"
    );

    return c.json(
      {
        success: false,
        message: "Error deleting user",
      },
      INTERNAL_SERVER_ERROR
    );
  }
});

export default app;
