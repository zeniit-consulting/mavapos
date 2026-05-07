import type { AuthUser } from "./types";

export function mapSupabaseUser(user: {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    role?: string;
    outlet?: string;
  };
}): AuthUser {
  const role = user.user_metadata?.role === "Kasir" ? "Kasir" : "Owner";
  const email = user.email ?? "";

  return {
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      email.split("@")[0] ??
      "User",
    email,
    role,
    outlet: user.user_metadata?.outlet ?? "Outlet Mava Demo",
  };
}
