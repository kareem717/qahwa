import React from "react";
import { Header } from "../components/header";
import { Badge } from "@note/ui/components/badge";
import { UserButton } from "../components/auth/user-button";
import { Button } from "@note/ui/components/button";
import { useAuth } from "../hooks/use-auth";
import { LoginButton } from "../components/auth/login-button";
import { LogoutDialog } from "../components/auth/logout-dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getClient } from "../lib/api";
import { router } from "../routes/router";
import { ScrollArea } from "@note/ui/components/scroll-area";
export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { data, isLoading, error } = useAuth()
  const { mutateAsync: createNote, isPending } = useMutation({
    mutationFn: async () => {
      const api = await getClient()

      const response = await api.note.$post()

      const { note } = await response.json()

      return note
    },
    onError: () => toast.error("Failed to create note"),
  })

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <LoginButton />
            <LogoutDialog />
          </div>
        )}
      </div>
    )
  }

  async function handleCreateNote() {
    //TODO: save to state, and read from state on the note page
    const note = await createNote()
    router.navigate({
      to: "/note/$id",
      params: {
        id: note.id.toString()
      }
    })
    toast.success("Note created")
  }

  return (
    <div className="h-screen relative">
      <Header
        leftTag={(
          <Badge variant="outline" className="text-muted-foreground tracking-wide font-mono text-xs px-1 h-5 rounded-sm">
            <span className="text-xs">BETA</span>
          </Badge>
        )}
      >
        <div className="flex items-center gap-1">
          <Button
            onClick={handleCreateNote}
            disabled={isPending}
            variant="secondary"
            size="sm"
            className="h-7 font-normal text-xs"
          >
            New Note
          </Button>
          <UserButton />
        </div>
      </Header>
      <main className="fixed top-[41.5px] w-full h-[calc(100vh-41.5px)] p-1">
        <ScrollArea className="h-full rounded-md border">
          {children}
        </ScrollArea>
      </main>
    </div>
  );
}
