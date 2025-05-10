import { Button, buttonVariants } from "@note/ui/components/button";
import React from "react";
// import { AudioRecorder } from "@note/desktop/components/audio-recorder";

export default function HomePage() {
  const [jwt, setJwt] = React.useState<string | null>(null)

  React.useEffect(() => {
    window.electronAuth.getToken().then(token => {
      setJwt(token)
    })
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center">
      {jwt ? (
        <Button onClick={() => {
          window.electronAuth.removeToken()
          window.location.reload()
        }}>
          Logout
        </Button>
      ) : (
        <Button onClick={() => window.electronAuth.openSignInWindow()}>
          Sign in
        </Button>
      )}
    </div>
  );
}
