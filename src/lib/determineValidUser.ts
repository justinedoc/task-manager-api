import type { AllModels } from "@/lib/role-utils.js";

export function determineValidUser(...user: (AllModels | null)[]): {
  valid: boolean;
  user: AllModels | null;
} {
  
  if (user.length === 0) {
    return {
      valid: false,
      user: null,
    };
  }

  for (const u of user) {
    if (u && u.email) {
      return {
        valid: true,
        user: u,
      };
    }
  }
  return {
    valid: false,
    user: null,
  };
}
