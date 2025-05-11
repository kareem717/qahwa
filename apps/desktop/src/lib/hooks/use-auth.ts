import { useQuery } from "@tanstack/react-query"
import { getClient } from "../api"

export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.auth.session.$get()
      const body = await response.json()

      return body
    },
  })
}