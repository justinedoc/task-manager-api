import type { IUserLean } from "@/types/user-type.js";

export function formatAuthSuccessResponse(message: string, data: IUserLean) {
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
