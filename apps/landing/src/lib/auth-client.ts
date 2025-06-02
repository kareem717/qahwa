import { createClient } from "@qahwa/auth/client";

export const authClient = createClient({
  baseURL: import.meta.env.VITE_API_URL,
  basePath: "/auth",
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
