import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cloudflareMiddleware } from "../lib/middleware/cf";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    // 1. Get R2 S3 API credentials and bucket name from environment for AWS SDK
    if (!context.cloudflare) {
      throw new Error(
        "Cloudflare environment variables (env) not found in context.",
      );
    }
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = context.cloudflare;
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      throw new Error("Cloudflare environment variables (env) not found in context.");
    }


    const { platform } = data;

    // 2. Configure S3 Client to interact with R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    let latestVersionObjectKey: string | undefined;
    let latestVersionObjectName: string | undefined;

    // 3. List objects and find the latest version using AWS S3 SDK
    try {
      const listObjectsCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: `releases/${platform}`,
      });
      const listedObjectsOutput = await s3Client.send(listObjectsCommand);

      if (!listedObjectsOutput.Contents || listedObjectsOutput.Contents.length === 0) {
        throw new Error(
          `No application versions found for platform "${platform}" under prefix "${platform}" using S3 SDK.`,
        );
      }

      // Sort objects by LastModified date in descending order
      const sortedObjects = listedObjectsOutput.Contents.sort((a, b) => {
        const timeA = a.LastModified ? a.LastModified.getTime() : 0;
        const timeB = b.LastModified ? b.LastModified.getTime() : 0;
        return timeB - timeA;
      });

      const latestObject = sortedObjects[0];

      if (!latestObject || !latestObject.Key) {
        throw new Error("Could not determine the latest version from S3 list.");
      }

      latestVersionObjectKey = latestObject.Key;
      latestVersionObjectName = latestVersionObjectKey.substring(
        latestVersionObjectKey.lastIndexOf("/") + 1,
      );

    } catch (error) {
      console.error("Error listing objects from R2 using S3 SDK:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to list objects from R2: ${error.message}`);
      }
      throw new Error("Failed to list objects from R2.");
    }


    if (!latestVersionObjectKey || !latestVersionObjectName) {
      // This should ideally be caught by earlier checks, but as a safeguard:
      throw new Error("Latest version key or name could not be determined.");
    }

    // 4. Create a GetObjectCommand with response header overrides
    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: latestVersionObjectKey,
      ResponseContentDisposition: `attachment; filename="${latestVersionObjectName}"`,
      ResponseContentType: "application/octet-stream",
    });

    // 5. Generate the presigned URL using the AWS SDK
    try {
      const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: 3600, // URL expires in 1 hour
      });
      return presignedUrl;
    } catch (error) {
      console.error("Error creating S3 presigned URL for R2:", error);
      throw new Error("Failed to generate download link using S3 signing.");
    }
  });
