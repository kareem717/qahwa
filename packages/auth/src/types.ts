import type { createServerClient } from "./server";

type AuthInstance = ReturnType<typeof createServerClient>;

export type AuthUser = AuthInstance['$Infer']['Session']['user']
export type AuthSession = AuthInstance['$Infer']['Session']['session']

export type AuthType = {
  Variables: {
    user: AuthUser | null
    session: AuthSession | null
  }
}