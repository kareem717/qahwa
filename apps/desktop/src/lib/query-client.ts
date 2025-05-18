import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient;

export function getQueryClient() {
  if (!queryClient) {
    console.log("Creating query client")
    queryClient = new QueryClient();
  }
  return queryClient;
}