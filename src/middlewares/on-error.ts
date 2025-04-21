import { ENV } from "@/configs/env-config.js";
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
} from "stoker/http-status-codes";
import { ZodError } from "zod";

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    return c.json(
      {
        success: false,
        errors: fieldErrors,
        formErrors: formErrors.length ? formErrors : undefined,
      },
      { status: BAD_REQUEST }
    );
  }

  const currentStatus: number =
    "status" in err ? (err.status as number) : c.newResponse(null).status;

  const statusCode: StatusCode =
    currentStatus !== OK
      ? (currentStatus as StatusCode)
      : INTERNAL_SERVER_ERROR;

  // 3) Build payload
  const payload: Record<string, unknown> = {
    success: false,
    message: err.message,
  };
  if (ENV.ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  return c.json(payload, {
    status: statusCode as unknown as ContentfulStatusCode,
  });
};
