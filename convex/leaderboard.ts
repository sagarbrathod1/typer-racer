import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const MAX_REASONABLE_WPM = 250; // World record is ~216 WPM
const GAME_DURATION_SECONDS = 30;
const DURATION_TOLERANCE_MS = 2000; // Allow 2 second tolerance for network latency

type GameResult = {
    startTime: number;
    endTime: number;
    charsTyped: number;
    corpusLength: number;
};

function validateAndCalculateWPM(gameResult: GameResult): number {
    const { startTime, endTime, charsTyped, corpusLength } = gameResult;

    const durationMs = endTime - startTime;
    const expectedDurationMs = GAME_DURATION_SECONDS * 1000;

    if (durationMs < expectedDurationMs - DURATION_TOLERANCE_MS) {
        throw new Error('Invalid game duration: too short');
    }

    if (durationMs > expectedDurationMs + DURATION_TOLERANCE_MS * 5) {
        throw new Error('Invalid game duration: too long');
    }

    if (charsTyped < 0) {
        throw new Error('Invalid character count: negative');
    }

    if (charsTyped > corpusLength) {
        throw new Error('Invalid character count: exceeds corpus length');
    }

    const durationMinutes = durationMs / 60000;
    const wpm = Math.round((charsTyped / 5 / durationMinutes) * 100) / 100;

    if (wpm > MAX_REASONABLE_WPM) {
        throw new Error(
            `Invalid WPM: ${wpm} exceeds maximum reasonable WPM of ${MAX_REASONABLE_WPM}`
        );
    }

    return wpm;
}

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
        gameResult: v.object({
            startTime: v.number(),
            endTime: v.number(),
            charsTyped: v.number(),
            corpusLength: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Must be authenticated to save score');
        }

        const validatedWpm = validateAndCalculateWPM(args.gameResult);

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
                scores: [...existingByUserId.scores, validatedWpm],
                updatedAt: now,
            });
            return { id: existingByUserId._id, wpm: validatedWpm };
        }

        const existingByUsername = await ctx.db
            .query('leaderboard')
            .withIndex('by_username', (q) => q.eq('username', username))
            .first();

        if (existingByUsername) {
            await ctx.db.patch(existingByUsername._id, {
                userId: userId,
                email: email,
                scores: [...existingByUsername.scores, validatedWpm],
                updatedAt: now,
            });
            return { id: existingByUsername._id, wpm: validatedWpm };
        }

        const id = await ctx.db.insert('leaderboard', {
            userId: userId,
            username: username,
            email: email,
            scores: [validatedWpm],
            createdAt: now,
            updatedAt: now,
        });

        return { id, wpm: validatedWpm };
    },
});

export const updateUserScores = mutation({
    args: {
        gameResult: v.object({
            startTime: v.number(),
            endTime: v.number(),
            charsTyped: v.number(),
            corpusLength: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error('Must be authenticated to save score');
        }

        const validatedWpm = validateAndCalculateWPM(args.gameResult);

        const userId = identity.subject;

        const user = await ctx.db
            .query('leaderboard')
            .withIndex('by_userId', (q) => q.eq('userId', userId))
            .first();

        if (!user) {
            throw new Error('User not found');
        }

        const updatedScores = [...user.scores, validatedWpm];

        await ctx.db.patch(user._id, {
            scores: updatedScores,
            updatedAt: Date.now(),
        });

        return { success: true, wpm: validatedWpm };
    },
});
