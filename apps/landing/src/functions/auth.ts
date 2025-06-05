import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { authClient } from "../lib/auth-client";
import { createClient } from "@qahwa/sdk";
import { getHeaders, getHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
export const getSessionFunction = createServerFn({ method: "GET" }).handler(
  async () =>
    await authClient.getSession({
      fetchOptions: {
        headers: getWebRequest()?.headers,
      },
    }),
);

export const getBillingPortalUrl = createServerFn({ method: "GET" })
  .validator(z.object({
    returnUrl: z.string().url(),
  })).handler(
    async ({ data }) => {
      const headers = getHeader("Cookie")
      console.log('COOKIE', headers)
      const apiClient = createClient({
        baseUrl: import.meta.env.VITE_API_URL,
        headers: {
          'cookie': headers || '',
        },
      });

      const resp = await apiClient.auth["billing-portal"].$get({
        query: {
          returnUrl: data.returnUrl
        },
      });

      if (!resp.ok) {
        //TODO: add sentry error
        throw new Error("Failed to get billing portal url");
      }

      return await resp.json();
    }
  );