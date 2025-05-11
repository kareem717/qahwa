import { hc } from "hono/client";
import type { RouteType } from "@note/api/type";

const createClient = async () => {
  const token = await window.electronAuth.getToken()

  return hc<RouteType>(import.meta.env.VITE_API_URL, {
    headers: {
      "x-api-key": token,
      "Content-Type": "application/json",
    },
  });
}

let client: Awaited<ReturnType<typeof createClient>> | null = null

export const getClient = async () => {
  if (!client) {
    client = await await createClient()
  }

  return client
}