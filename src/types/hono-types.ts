import type { AuthPayload } from "@/utils/token-utils.js";

export type AppBindings = {
  Variables: {
    user: AuthPayload;
  };
};
