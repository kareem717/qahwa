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
  noteId,
  enabled = true,
}: {
  noteId: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [NOTE_QUERY_KEY, noteId],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.note[":id"].$get({
        param: {
          id: noteId.toString(),
        },
      })

      const body = await response.json()
      return body.note || undefined
    },
    enabled,
  })
}