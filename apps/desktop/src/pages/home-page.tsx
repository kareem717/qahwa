import React from "react";
import { useAuth } from "../hooks/use-auth";
import { AudioTap } from "@note/desktop/components/audio-tap-button";
import { LoginButton } from "@note/desktop/components/auth/login-button";
import { UserButton } from "../components/auth/user-button";

export default function HomePage() {
  const { data } = useAuth()

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {data ? (
        <div className="flex flex-col items-center justify-center">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          {/* <LogoutButton /> */}
          <UserButton />
          <AudioTap />
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
