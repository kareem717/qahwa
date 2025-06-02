import React from "react";
import type { AuthUser, AuthSession } from "@qahwa/auth/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getClient } from "@qahwa/desktop/lib/api";

const AuthContext = React.createContext<{
  user?:
    | (Omit<AuthUser, "createdAt" | "updatedAt"> & {
        createdAt: string;
        updatedAt: string;
      })
    | null;
  session?:
    | (Omit<AuthSession, "createdAt" | "updatedAt" | "expiresAt"> & {
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
      })
    | null;
  isSigningOut: boolean;
  isLoading: boolean;
  signOut: () => Promise<{ success: boolean }>;
}>({
  user: null,
  session: null,
  isSigningOut: false,
  isLoading: false,
  signOut: () => Promise.resolve({ success: false }),
});

export const useAuth = () => {
  return React.useContext(AuthContext);
};

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const api = await getClient();

      const response = await api.auth["get-session"].$get();
      const body = await response.json();

      return body || undefined;
    },
  });

  const { mutateAsync: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      try {
        const api = await getClient();
        await api.auth["sign-out"].$post();
      } catch (error) {
        console.error(error);

        return { success: false };
      }

      window.electronAuth.removeToken();

      return { success: true };
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: data?.user || null,
        session: data?.session || null,
        signOut,
        isSigningOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
