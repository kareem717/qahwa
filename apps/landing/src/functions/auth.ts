import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from '@tanstack/react-start/server'
import { authClient } from "../lib/auth-client";

export const getSessionFunction = createServerFn({ method: 'GET' }).handler(
  async () => await authClient.getSession({
    fetchOptions: {
      headers: getWebRequest()?.headers
    }
  })
)
