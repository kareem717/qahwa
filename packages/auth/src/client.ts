import {
  inferAdditionalFields,
  apiKeyClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import type { AuthType } from "./types";
import { stripeClient } from "@better-auth/stripe/client";

export const createClient = ({
  baseURL,
  basePath,
}: {
  baseURL: string;
  basePath: string;
}) =>
  createAuthClient({
    baseURL, // base url of our API - where the server auth handler is mounted
    basePath, // base path that the auth handler is mounted on - API
    fetchOptions: {
      credentials: "include",
    },
    plugins: [
      inferAdditionalFields<AuthType>(),
      apiKeyClient(),
      stripeClient({
        subscription: true,
      }),
    ],
  });
