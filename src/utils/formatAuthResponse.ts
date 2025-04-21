import type { IUser } from "@/schemas/user-schema.js";

export function formatAuthSuccessResponse(message: string, data: IUser) {
  return {
    success: true,
    message,
    data: {
      user: {
        id: data._id,
        firstname: data.firstname,
        lastname: data.lastname,
        username: data.username,
        email: data.email,
      },
    },
  };
}
