import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getLeaderboard = query({
    args: {},
    handler: async (ctx) => {
        const leaderboard = await ctx.db.query('leaderboard').collect();
        return leaderboard.map((entry) => ({
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
            .query('leaderboard')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .first();
    },
});

export const createUser = mutation({
    args: {
        initialScore: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Must be authenticated to save score');
        }

        const userId = identity.subject;
        const username = identity.nickname ?? identity.name ?? 'Anonymous';
        const email = identity.email;

        const existingByUserId = await ctx.db
            .query('leaderboard')
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first();

        const now = Date.now();

        if (existingByUserId) {
            await ctx.db.patch(existingByUserId._id, {
                scores: [...existingByUserId.scores, args.initialScore],
                updatedAt: now,
            });
            return existingByUserId._id;
        }

        const existingByUsername = await ctx.db
            .query('leaderboard')
            .withIndex('by_username', (q) => q.eq('username', username))
            .first();

        if (existingByUsername) {
            await ctx.db.patch(existingByUsername._id, {
                userId: userId,
                email: email,
                scores: [...existingByUsername.scores, args.initialScore],
                updatedAt: now,
            });
            return existingByUsername._id;
        }

        return await ctx.db.insert('leaderboard', {
            userId: userId,
            username: username,
            email: email,
            scores: [args.initialScore],
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const updateUserScores = mutation({
    args: {
        newScore: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Must be authenticated to save score');
        }

        const userId = identity.subject;

        const user = await ctx.db
            .query('leaderboard')
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first();

        if (!user) {
            throw new Error('User not found');
        }

        const updatedScores = [...user.scores, args.newScore];

        await ctx.db.patch(user._id, {
            scores: updatedScores,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
