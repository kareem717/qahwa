import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import { getWebRequest } from "@tanstack/react-start/server";

const SUBSCRIPTION_QUERY_KEY = "subscription" as const;

export function useSubscription() {
  return useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY],
    queryFn: async () => {
      const { data: subscriptions, error } = await authClient.subscription.list({
        fetchOptions: {
          headers: getWebRequest()?.headers,
        },
      });

      if (error) {
        //TODO: add sentry
        throw error;
      }

      const activeSubscription = subscriptions?.find(
        sub => sub.status === "active" || sub.status === "trialing"
      );

      return activeSubscription;
    },
  });
}

export function useClearSubscription() {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEY] });
}
