import { Button } from "@qahwa/ui/components/button";
import { useAuth } from "../providers/auth-provider";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogTrigger,
  DialogFooter,
} from "@qahwa/ui/components/dialog";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

interface SignOutDialogProps extends ComponentPropsWithoutRef<typeof Dialog> {
  onLogout?: () => void;
  contentProps?: ComponentPropsWithoutRef<typeof DialogContent>;
  children?: ReactNode;
}

export function SignOutDialog({
  onLogout,
  contentProps,
  children,
  ...props
}: SignOutDialogProps) {
  const { signOut, isSigningOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    const { success } = await signOut();

    if (success) {
      // TODO: would like to avoid reloading the page
      window.location.reload();
      onLogout?.();
      setIsOpen(false);
    }
  }

  function toggleOpen() {
    setIsOpen(!isOpen);
    props.onOpenChange?.(isOpen);
  }

  return (
    <Dialog {...props} open={isOpen} onOpenChange={toggleOpen}>
      <DialogTrigger asChild>
        {children ? children : <Button variant="outline">Sign out</Button>}
      </DialogTrigger>
      <DialogContent {...contentProps}>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This will sign you out of your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => toggleOpen()}>Cancel</Button>
          <Button
            onClick={handleLogout}
            disabled={isSigningOut}
            variant="secondary"
          >
            {isSigningOut && <Loader2 className="size-4 animate-spin mr-2" />}
            Sign out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
