import { useQuery } from "@tanstack/react-query"
import { getClient } from "../lib/api"

export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.auth["get-session"].$get()
      const body = await response.json()

      return body || undefined
    },
  })
}