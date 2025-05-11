import { useQuery } from "@tanstack/react-query"
import { getClient } from "../lib/api"

export function useUserNotes() {
  return useQuery({
    queryKey: ["note"],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.note.$get()

      const body = await response.json()
      return body.notes || []
    }
  })
}

export function useNote(noteId: number) {
  return useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const api = await getClient()

      const response = await api.note[":id"].$get({
        param: {
          id: `${noteId}`,
        },
      })

      const body = await response.json()
      return body.note || undefined
    }
  })
}