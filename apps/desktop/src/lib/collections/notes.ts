import {
  createQueryCollection,
  type QueryCollection,
} from "@tanstack/db-collections";
import type { qahwa } from "@qahwa/db/types";
import { SelectNoteSchema } from "@qahwa/db/validation";
import { getClient } from "../api";
import { getQueryClient } from "../query-client";

export const NOTES_COLLECTION_KEY = "notes";

export const notesCollection = createQueryCollection<
  Pick<qahwa, "id" | "title" | "updatedAt">
>({
  queryClient: getQueryClient(),
  id: NOTES_COLLECTION_KEY,
  queryKey: [NOTES_COLLECTION_KEY],
  queryFn: async () => {
    const api = await getClient();
    const response = await api.note.$get();

    if (!response.ok) {
      console.error("Error fetching notes", response);
      throw new Error("Error fetching notes");
    }

    const { notes } = await response.json();

    return notes;
  },
  getId: (item) => String(item.id),
  schema: SelectNoteSchema.pick({ id: true, title: true, updatedAt: true }), // any standard schema
});

const FULL_NOTE_COLLECTION_KEY = "full-qahwa";

// Define the maximum size for the cache
const MAX_FULL_NOTE_CACHE_SIZE = 2; // Example: Max 50 items

const fullNoteCollectionCache = new Map<number, QueryCollection<qahwa>>();

export const fullNoteCollection = (id: number) => {
  if (id < 1) {
    return createQueryCollection<qahwa>({
      queryClient: getQueryClient(),
      id: `${FULL_NOTE_COLLECTION_KEY}-${id}`, // Make collection id specific to the qahwa id
      queryKey: [FULL_NOTE_COLLECTION_KEY, id],
      queryFn: async () => [],
      getId: (item) => String(item.id),
      schema: SelectNoteSchema, // any standard schema
    });
  }

  if (fullNoteCollectionCache.has(id)) {
    const collection = fullNoteCollectionCache.get(id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // For LRU: remove and re-set to mark as most recently used
    fullNoteCollectionCache.delete(id);
    fullNoteCollectionCache.set(id, collection);
    return collection;
  }

  const collection = createQueryCollection<qahwa>({
    queryClient: getQueryClient(),
    id: `${FULL_NOTE_COLLECTION_KEY}-${id}`, // Make collection id specific to the qahwa id
    queryKey: [FULL_NOTE_COLLECTION_KEY, id],
    queryFn: async () => {
      const api = await getClient();
      const response = await api.note[":id"].$get({
        param: { id: id.toString() },
      });

      if (!response.ok) {
        throw new Error("Error fetching notes");
      }

      const { qahwa } = await response.json();

      return [qahwa];
    },
    getId: (item) => String(item.id),
    schema: SelectNoteSchema, // any standard schema
  });

  // Before adding the new item, check if the cache is at or over its max size
  // qahwa: We check >= because we are about to add one more item.
  // If size is currently 49 and MAX is 50, after adding it will be 50 (ok).
  // If size is currently 50 and MAX is 50, after adding it will be 51 (needs eviction).
  if (fullNoteCollectionCache.size >= MAX_FULL_NOTE_CACHE_SIZE) {
    // Evict the least recently used item (the first item in iteration order for a Map)
    const oldestKey = fullNoteCollectionCache.keys().next().value;
    if (oldestKey !== undefined) {
      // Ensure the cache wasn't empty or became empty concurrently
      fullNoteCollectionCache.delete(oldestKey);
    }
  }

  fullNoteCollectionCache.set(id, collection);

  return collection;
};
