import type { ContentfulStatusCode } from "hono/utils/http-status";
import { INTERNAL_SERVER_ERROR } from "stoker/http-status-codes";

export class TaskError extends Error {
  public status: ContentfulStatusCode;
  public code: string;

  constructor(
    message: string,
    status = INTERNAL_SERVER_ERROR,
    code = "TASK_ERROR"
  ) {
    super(message);
    this.name = "TaskError";
    this.status = status as unknown as ContentfulStatusCode;
    this.code = code;
    Object.setPrototypeOf(this, TaskError.prototype);
  }
}
