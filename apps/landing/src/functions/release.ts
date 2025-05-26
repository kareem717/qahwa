import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cloudflareMiddleware } from "../lib/middleware/cf"; // Ensure this correctly provides env vars

const PLATFORMS = ["darwin/arm64", "darwin/x64"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const getLatestRealseLinkFunction = createServerFn({ method: "GET" })
  .validator(
    z.object({
      platform: z.enum(PLATFORMS),
    }),
  )
  .middleware([cloudflareMiddleware])
  .handler(async ({ data, context }) => {
    if (!context.cloudflare || !context.cloudflare) { // Adjusted to check for context.cloudflare.env
      throw new Error(
        "Cloudflare environment (context.cloudflare) not found.",
      );
    }
    const { R2_BUCKET } = context.cloudflare; // Assuming env vars are on context.cloudflare.env
    const { platform } = data;

    let latestVersionObjectKey: string | undefined;
    let latestVersionObjectName: string | undefined;

    try {
      const listedObjectsOutput = await R2_BUCKET.list({
        prefix: `releases/${platform}/`,
      });

      if (
        listedObjectsOutput.objects.length === 0
      ) {
        throw new Error(
          `No application versions found for platform "${platform}" under prefix "releases/${platform}" using R2 binding.`,
        );
      }

      const latestObject = listedObjectsOutput.objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime()).at(0);

      if (!latestObject) {
        throw new Error("Could not determine the latest version from R2 list.");
      }

      latestVersionObjectKey = latestObject.key;
      latestVersionObjectName = latestVersionObjectKey.substring(
        latestVersionObjectKey.lastIndexOf("/") + 1,
      );
    } catch (error) {
      console.error("Error listing objects from R2 using S3 SDK:", error);
      if (error instanceof Error) {
        // It's good to log the original error message for debugging
        throw new Error(
          `Failed to list objects from R2: ${error.message}`,
        );
      }
      throw new Error("Failed to list objects from R2 due to an unknown error.");
    }

    if (!latestVersionObjectKey || !latestVersionObjectName) {
      throw new Error("Latest version key or name could not be determined.");
    }

    return `${import.meta.env.VITE_RELEASE_S3_ENDPOINT}/${latestVersionObjectKey}`;
  });
