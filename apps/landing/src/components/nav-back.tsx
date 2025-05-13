
import { Button } from "@note/ui/components/button"
import { useRouter } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

export function NavBack({ className, onClick, ...props }: React.ComponentPropsWithoutRef<typeof Button>) {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        router.history.back()
        onClick?.(e)
      }}
      className={className}
      {...props}
    >
      <ArrowLeft className="size-4" />
    </Button>
  )
}