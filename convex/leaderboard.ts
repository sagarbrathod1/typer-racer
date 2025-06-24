import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const leaderboard = await ctx.db.query("leaderboard").collect();
    return leaderboard.map(entry => ({
      username: entry.username,
      scores: entry.scores,
      userId: entry.userId,
      email: entry.email,
    }));
  },
});

export const getUserByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaderboard")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    initialScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by username (for migration compatibility)
    const existingByUsername = await ctx.db
      .query("leaderboard")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    
    const now = Date.now();
    
    if (existingByUsername) {
      // Update existing user with userId and new score
      await ctx.db.patch(existingByUsername._id, {
        userId: args.userId,
        email: args.email,
        scores: [...existingByUsername.scores, args.initialScore],
        updatedAt: now,
      });
      return existingByUsername._id;
    }
    
    // Create new user
    return await ctx.db.insert("leaderboard", {
      userId: args.userId,
      username: args.username,
      email: args.email,
      scores: [args.initialScore],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUserScores = mutation({
  args: {
    userId: v.string(),
    newScore: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("leaderboard")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }

    const updatedScores = [...user.scores, args.newScore];
    
    await ctx.db.patch(user._id, {
      scores: updatedScores,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});