import { createClient } from "@qahwa/sdk";
import { buttonVariants } from "@qahwa/ui/components/button";
import { cn } from "@qahwa/ui/lib/utils";

const PLATFORMS = ["darwin"] as const;
const ARCHS = ["arm64"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type Arch = (typeof ARCHS)[number];

interface DownloadLinkProps extends React.ComponentProps<"a"> {
  platform: Platform;
  arch: Arch;
}

export function DownloadLink({
  children = "Download",
  platform,
  arch,
  onClick,
  ...props
}: DownloadLinkProps) {
  const api = createClient(import.meta.env.VITE_API_URL);

  const url = api.download[":platform"][":arch"].$url({
    param: {
      platform,
      arch,
    },
  });

  return (
    <a href={url.toString()} {...props} className={cn(buttonVariants(), props.className)}>
      {children}
    </a>
  );
}
