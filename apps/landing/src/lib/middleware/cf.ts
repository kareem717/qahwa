import { createMiddleware } from "@tanstack/react-start";

async function getBindings() {
  if (import.meta.env.DEV) {
    const { getPlatformProxy } = await import("wrangler");
    const { env } = await getPlatformProxy();
    return env as unknown as CloudflareBindings;
  }

  return process.env as unknown as CloudflareBindings;
}

export const cloudflareMiddleware = createMiddleware().server<{
  cloudflare: CloudflareBindings;
}>(async ({ next }) => {
  return next({
    context: {
      cloudflare: await getBindings(),
    },
  });
});
