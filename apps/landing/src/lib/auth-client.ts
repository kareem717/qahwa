import type { AuthType } from "@note/api/auth";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL, // base url of our API - where the server auth handler is mounted
  basePath: "/auth", // base path that the auth handler is mounted on - API
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: import.meta.env.VITE_API_SECRET_KEY, // our auth secret to access the API
    },
    credentials: "include",
  },
  plugins: [inferAdditionalFields<AuthType>(), magicLinkClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];