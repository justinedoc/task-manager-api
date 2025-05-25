import type { IAdminLean } from "@/types/admin-types.js";
import type { IUserLean } from "@/types/user-type.js";

export function formatAuthSuccessResponse(message: string, data: IUserLean | IAdminLean) {
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
