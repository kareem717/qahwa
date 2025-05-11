import { Button } from "@note/ui/components/button";
import React from "react";
import { useAuth } from "../lib/hooks/use-auth";

export default function HomePage() {
  const { data } = useAuth()

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {data ? (
        <div className="flex flex-col items-center justify-center">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <Button onClick={() => {
            window.electronAuth.removeToken()
            window.location.reload()
          }}>
            Logout
          </Button>
        </div>
      ) : (
        <Button onClick={() => window.electronAuth.openSignInWindow()}>
          Sign in
        </Button>
      )}
    </div>
  );
}
