import { Button } from '@note/ui/components/button';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@note/ui/components/alert-dialog"

interface LogoutDialogProps extends React.ComponentPropsWithoutRef<typeof AlertDialog> {
  onLogout?: () => void;
  contentProps?: React.ComponentPropsWithoutRef<typeof AlertDialogContent>;
}

export function LogoutDialog({ onLogout, children, contentProps, ...props }: LogoutDialogProps) {

  function handleLogout() {
    window.electronAuth.removeToken()
    onLogout?.()

    // TODO: would like to avoid reloading the page
    window.location.reload()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ? children : <Button variant="outline">Logout</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent {...contentProps}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}