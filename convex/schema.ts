import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  corpus: defineTable({
    words: v.string(),
    sagar_wpm: v.array(v.string()),
    leaderboard: v.optional(v.array(v.any())), // Legacy field for compatibility
  }),
  
  leaderboard: defineTable({
    userId: v.optional(v.string()), // Clerk user ID for reliable identification
    username: v.string(),
    email: v.optional(v.string()),
    scores: v.array(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"])
    .index("by_username", ["username"]),
});