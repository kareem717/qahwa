import { hc } from "hono/client";
import type { RouteType } from "@note/api/type";

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
