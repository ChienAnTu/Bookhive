import type { User } from "@/app/types/user";

export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  // must have basic info
  if (!user.firstName || !user.lastName || !user.email) return false;

  // must have address
  if (!user.streetAddress || !user.city || !user.state || !user.zipCode) return false;

  return true;
}
