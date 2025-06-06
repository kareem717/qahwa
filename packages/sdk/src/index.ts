import { hc } from "hono/client";
import type { RouteType } from "@qahwa/api/type";

export const createClient = ({
  baseUrl,
  token,
  headers,
}: {
  baseUrl: string;
  token?: string;
  headers?: Headers | Record<string, string>;
}) =>
  hc<RouteType>(baseUrl, {
    headers: {
      ...headers,
      ...(token
        ? {
            "x-api-key": token,
          }
        : undefined),
      "Content-Type": "application/json",
    },
  });
