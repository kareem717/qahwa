import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";

const SUBSCRIPTION_QUERY_KEY = "subscription" as const;

export function useSubscription() {
  return useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY],
    queryFn: async () => {
      const { data: subscriptions, error } = await authClient.subscription.list();

      if (error) {
        return null;
      }

      
      return subscriptions?.find(
        sub => sub.status === "active" || sub.status === "trialing"
      ) || null;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useClearSubscription() {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
}
