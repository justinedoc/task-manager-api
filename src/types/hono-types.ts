import type { AuthPayload } from "@/utils/token-utils.js";

export type Variables = {
  user: AuthPayload;
};
