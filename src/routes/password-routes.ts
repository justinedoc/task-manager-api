import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { OK } from "stoker/http-status-codes";
import { z } from "zod";

const app = new Hono().basePath("/password");

app.post(
  "/forgot",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid("json");
    //TODO: Implement the logic for sending a password reset email

    

    return c.json(
      {
        success: true,
        message: "Password reset email sent successfully",
        data: { email },
      },
      OK
    );
  }
);

export default app;
