//TODO: add development bypass

import type { Subscription } from "@qahwa/auth/types";
import { PRO_PLAN_NAME } from "@qahwa/auth/subscriptions";

export enum ABACErrorCode {
  NOT_SUBSCRIBED = "NOT_SUBSCRIBED",
  INSUFFICIENT_SUBSCRIPTION = "INSUFFICIENT_SUBSCRIPTION",
  OUT_OF_QUOTA = "OUT_OF_QUOTA",
}

export class ABACError extends Error {
  constructor(
    message: string,
    options?: { cause?: unknown; code?: ABACErrorCode },
  ) {
    super(message, options);
    this.cause = options?.cause;
    this.code = options?.code;
  }

  cause?: unknown;
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

export const canTranscribe = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => {
  const currentSub = currentSubscription(subscriptions);
  if (currentSub?.plan !== PRO_PLAN_NAME) {
      return {
        success: false,
        error: new ABACError("You are not authorized to use this feature. Please upgrade to the Pro plan to use this feature.", {
          cause: {
            currentPlan: currentSub?.plan,
          },
          code: ABACErrorCode.INSUFFICIENT_SUBSCRIPTION,
      }),
    };
  }

  return {
    success: true,
    error: null,
  };
};

export const canGenerateNotes = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => {
  const currentSub = currentSubscription(subscriptions);
  if (currentSub?.plan !== PRO_PLAN_NAME) {
    return {
      success: false,
      error: new ABACError("You are not authorized to use this feature. Please upgrade to the Pro plan to use this feature.", {
        code: ABACErrorCode.INSUFFICIENT_SUBSCRIPTION,
        cause: `current plan: ${currentSub?.plan}`,
      }),
    };
  }

  return {
    success: true,
    error: null,
  };
};

// in theory can generate title = can create note
export const canGenerateTitle = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}): ABACResponse => {
  const currentSub = currentSubscription(subscriptions);
  if (currentSub?.plan !== PRO_PLAN_NAME) {
    return {
      success: false,
      error: new ABACError("You are not authorized to use this feature. Please upgrade to the Pro plan to use this feature.", {
        code: ABACErrorCode.INSUFFICIENT_SUBSCRIPTION,
        cause: `current plan: ${currentSub?.plan}`,
      }),
    };
  }

  return {
    success: true,
    error: null,
  };
};

const currentSubscription = (subscriptions: Subscription[]) => {
  if (!subscriptions.length) {
    return undefined;
  }

  return subscriptions.find(
    (s) => s.status === "active" || s.status === "trialing",
  );
};
