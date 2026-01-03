import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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
    })
        .index('by_userId', ['userId'])
        .index('by_username', ['username']),

    // Multiplayer race rooms
    races: defineTable({
        code: v.string(), // 6-char room code
        hostId: v.string(), // Clerk user ID
        guestId: v.optional(v.string()),
        hostUsername: v.string(),
        guestUsername: v.optional(v.string()),
        status: v.string(), // "waiting" | "countdown" | "racing" | "finished"
        corpus: v.string(), // Typing text for this race
        startTime: v.optional(v.number()), // When race actually starts (after countdown)
        createdAt: v.number(),
    })
        .index('by_code', ['code'])
        .index('by_status', ['status']),

    // Player progress during race
    raceProgress: defineTable({
        raceId: v.id('races'),
        odId: v.string(), // Clerk user ID
        charsTyped: v.number(),
        wpm: v.number(),
        finished: v.boolean(),
        finishTime: v.optional(v.number()),
        disconnected: v.boolean(),
        updatedAt: v.number(),
    }).index('by_race', ['raceId']),
});
