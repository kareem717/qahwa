import type { Subscription } from "@qahwa/auth/types";
import { PRO_PLAN_NAME } from "@qahwa/auth/subscriptions";
import { env } from "cloudflare:workers";

export enum ABACErrorCode {
  NOT_SUBSCRIBED = "NOT_SUBSCRIBED",
  INSUFFICIENT_SUBSCRIPTION = "INSUFFICIENT_SUBSCRIPTION",
  OUT_OF_QUOTA = "OUT_OF_QUOTA",
}

export class ABACError extends Error {
  constructor(
    message: string,
    options?: {
      cause?: string | Record<string, unknown>;
      code?: ABACErrorCode;
    },
  ) {
    super(message, options);
    this.cause = options?.cause;
    this.code = options?.code;
  }

  cause?: string | Record<string, unknown>;
  code?: ABACErrorCode;

  isPlanRelated() {
    const planRelatedCodes = [
      ABACErrorCode.INSUFFICIENT_SUBSCRIPTION,
      ABACErrorCode.OUT_OF_QUOTA,
      ABACErrorCode.NOT_SUBSCRIBED,
    ];
    return this.code !== undefined && planRelatedCodes.includes(this.code);
  }
}

export type ABACResponse =
  | {
      success: true;
      error: null;
    }
  | {
      success: false;
      error: ABACError;
    };

// Generic function to check if user has required subscription
const requiresProPlan = (
  subscriptions: Subscription[],
  featureName: string,
): ABACResponse => {
  if (env.BYPASS_SUBSCRIPTION_CHECK) {
    return { success: true, error: null };
  }

  const currentSub = currentSubscription(subscriptions);

  if (currentSub?.plan !== PRO_PLAN_NAME) {
    return {
      success: false,
      error: new ABACError(
        `You are not authorized to use ${featureName}. Please upgrade to the Pro plan to use this feature.`,
        {
          code: ABACErrorCode.INSUFFICIENT_SUBSCRIPTION,
          cause: { currentPlan: currentSub?.plan, requiredPlan: PRO_PLAN_NAME },
        },
      ),
    };
  }

  return { success: true, error: null };
};

export const canTranscribe = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => requiresProPlan(subscriptions, "transcription");

export const canGenerateNotes = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => requiresProPlan(subscriptions, "note generation");

export const canGenerateTitle = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => requiresProPlan(subscriptions, "title generation");

const currentSubscription = (subscriptions: Subscription[]) => {
  if (!subscriptions.length) {
    return undefined;
  }

  return subscriptions.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
};
