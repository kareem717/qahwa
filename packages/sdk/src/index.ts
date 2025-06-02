import { hc } from "hono/client";
import type { RouteType } from "@qahwa/api/type";

export const createClient = (baseUrl: string, token?: string) =>
  hc<RouteType>(baseUrl, {
    headers: {
      ...(token
        ? {
            "x-api-key": token,
          }
        : undefined),
      "Content-Type": "application/json",
    },
  });
