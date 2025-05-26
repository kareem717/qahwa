import { Button } from "@note/ui/components/button";
import { getLatestRealseLinkFunction, type Platform } from "../functions/release";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DownloadButtonProps extends React.ComponentProps<typeof Button> {
  platform: Platform;
}

export function DownloadButton({
  children = "Download",
  platform,
  onClick,
  ...props
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const serverFn = useServerFn(getLatestRealseLinkFunction);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    setIsLoading(true);
    try {
      const url = await serverFn({ data: { platform } });
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download the app");
    }
    setIsLoading(false);
    onClick?.(e);
  }

  return (
    <Button onClick={handleClick} disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
