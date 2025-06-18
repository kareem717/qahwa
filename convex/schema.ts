import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Better Auth tables
export const userSchema = {
  name: v.string(),
  email: v.string(),
  emailVerified: v.boolean(),
  image: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const sessionSchema = {
  userId: v.id("users"),
  expiresAt: v.number(),
  token: v.string(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const accountSchema = {
  userId: v.id("users"),
  accountId: v.string(),
  providerId: v.string(),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  idToken: v.optional(v.string()),
  accessTokenExpiresAt: v.optional(v.number()),
  refreshTokenExpiresAt: v.optional(v.number()),
  scope: v.optional(v.string()),
  password: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const verificationSchema = {
  identifier: v.string(),
  value: v.string(),
  expiresAt: v.number(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
};

export const apiKeySchema = {
  name: v.optional(v.string()),
  start: v.optional(v.string()),
  prefix: v.optional(v.string()),
  key: v.string(),
  userId: v.id("users"),
  refillInterval: v.optional(v.number()),
  refillAmount: v.optional(v.number()),
  lastRefillAt: v.optional(v.number()),
  enabled: v.optional(v.boolean()),
  rateLimitEnabled: v.optional(v.boolean()),
  rateLimitTimeWindow: v.optional(v.number()),
  rateLimitMax: v.optional(v.number()),
  requestCount: v.optional(v.number()),
  remaining: v.optional(v.number()),
  lastRequest: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  permissions: v.optional(v.string()),
  metadata: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Subscription tables
export const subscriptionSchema = {
  plan: v.string(),
  referenceId: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  status: v.string(),
  periodStart: v.optional(v.number()),
  periodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  seats: v.optional(v.number()),
  trialStart: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Application tables
export const noteSchema = {
  userId: v.id("users"),
  title: v.string(),
  transcript: v.array(v.object({
    timestamp: v.string(),
    sender: v.union(v.literal("me"), v.literal("them")),
    content: v.string(),
  })),
  userNotes: v.optional(v.string()),
  generatedNotes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const waitlistEmailSchema = {
  email: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export default defineSchema({
  // Better Auth tables
  users: defineTable(userSchema)
    .index("by_email", ["email"]),
  
  sessions: defineTable(sessionSchema)
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),
  
  accounts: defineTable(accountSchema)
    .index("by_user", ["userId"])
    .index("by_provider_account", ["providerId", "accountId"]),
  
  verifications: defineTable(verificationSchema)
    .index("by_identifier_value", ["identifier", "value"]),
  
  apiKeys: defineTable(apiKeySchema)
    .index("by_user", ["userId"])
    .index("by_key", ["key"]),
  
  // Subscription tables
  subscriptions: defineTable(subscriptionSchema)
    .index("by_status", ["status"])
    .index("by_stripe_customer", ["stripeCustomerId"]),
  
  // Application tables
  notes: defineTable(noteSchema)
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),
  
  waitlistEmails: defineTable(waitlistEmailSchema)
    .index("by_email", ["email"]),
});