import { useQuery } from "@tanstack/react-query"
import { getClient } from "../lib/api"

export const NOTE_QUERY_KEY = "note"

export function useUserNotes() {
  return useQuery({
    queryKey: [NOTE_QUERY_KEY],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.note.$get()

      const body = await response.json()
      return body.notes || []
    }
  })
}

export function useNote({
  id,
  title,
  enabled = false,
}: {
  id: number
  title: string
  enabled: boolean
}) {
  return useQuery({
    queryKey: [NOTE_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) {
        return undefined
      }

      const api = await getClient()

      const response = await api.note[":id"].$get({
        param: {
          id: id.toString(),
        },
      })

      const body = await response.json()
      return body.note
    },
    enabled,
    initialData: {
      id: id,
      userId: 0,
      title: title || "",
      transcript: [],
      userNotes: "" as never,
      generatedNotes: "" as never,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    staleTime: 60 * 1000,
  })
}