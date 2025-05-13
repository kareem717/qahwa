import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@note/ui/components/dialog"
import { buttonVariants } from "@note/ui/components/button"
import { cn } from "@note/ui/lib/utils"
import { WaitlistForm } from "@note/landing/components/waitlist-form"

export function DownloadTeaser({ children = "Download", className, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  return (
    <Dialog>
      <DialogTrigger className={cn(buttonVariants(), className)} {...props}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
          <DialogDescription>
            Be the first to know when we launch and get a chance to recieve a discount.
          </DialogDescription>
        </DialogHeader>
        <WaitlistForm className="w-full" />
      </DialogContent>
    </Dialog>

  )
}
