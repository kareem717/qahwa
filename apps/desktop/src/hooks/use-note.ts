import { useQuery } from "@tanstack/react-query"
import { getClient } from "../lib/api"

export function useNote({ id }: { id: string }) {
  return useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.auth["get-session"].$get()
      const body = await response.json()

      return body || undefined
    },
  })
}