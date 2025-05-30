import { buttonVariants } from "@note/ui/components/button";
import { cn } from "@note/ui/lib/utils";

const PLATFORMS = ["darwin/arm64", "darwin/x64"] as const;

export type Platform = (typeof PLATFORMS)[number];

interface DownloadLinkProps extends React.ComponentProps<'a'> {
  platform: Platform;
}

export function DownloadLink({
  children = "Download",
  platform,
  onClick,
  ...props
}: DownloadLinkProps) {

  let url = "";
  switch (platform) {
    case "darwin/arm64":
      url = `${import.meta.env.VITE_RELEASE_S3_ENDPOINT}/releases/latest-darwin-arm64.zip`;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return (
    <a href={url} {...props} className={cn(buttonVariants(), props.className)}>
      {children}
    </a >
  );
}
