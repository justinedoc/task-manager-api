import {
  authMiddleware,
  isSelfOrAdmin,
} from "@/middlewares/auth-middleware.js";
import User from "@/models/user-model.js";
import {
  GetUserByIdZodSchema,
  UpdateUserZodSchema,
} from "@/schemas/user-schema.js";
import type { Variables } from "@/types/hono-types.js";
import logger from "@/utils/logger.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  OK,
} from "stoker/http-status-codes";

const unauthorizedRes = {
  success: false,
  message: "You are forbidden to perform this action",
};

const app = new Hono<{
  Variables: Variables;
}>();

app.use(authMiddleware);

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
        message: "Account deleted successfully",
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
