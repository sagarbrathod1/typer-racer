import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
    return sessions;
  },
});

export const saveSession = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    wpm: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      username: args.username,
      wpm: args.wpm,
      accuracy: args.accuracy,
      createdAt: Date.now(),
    });
  },
});

export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (sessions.length === 0) {
      return null;
    }

    const wpms = sessions.map((s) => s.wpm);
    const accuracies = sessions.map((s) => s.accuracy);

    return {
      totalRaces: sessions.length,
      bestWpm: Math.max(...wpms),
      averageWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
      averageAccuracy: (accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(2),
    };
  },
});
