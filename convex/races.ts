import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export const createRace = mutation({
    args: {
        hostId: v.string(),
        hostUsername: v.string(),
    },
    handler: async (ctx, args) => {
        // Get corpus for this race
        const corpusDoc = await ctx.db.query('corpus').first();
        if (!corpusDoc) {
            throw new Error('No corpus available');
        }

        let code = generateRoomCode();
        let existing = await ctx.db
            .query('races')
            .withIndex('by_code', (q) => q.eq('code', code))
            .first();

        while (existing) {
            code = generateRoomCode();
            existing = await ctx.db
                .query('races')
                .withIndex('by_code', (q) => q.eq('code', code))
                .first();
        }

        const raceId = await ctx.db.insert('races', {
            code,
            hostId: args.hostId,
            hostUsername: args.hostUsername,
            status: 'waiting',
            corpus: corpusDoc.words,
            createdAt: Date.now(),
        });

        await ctx.db.insert('raceProgress', {
            raceId,
            odId: args.hostId,
            charsTyped: 0,
            wpm: 0,
            finished: false,
            disconnected: false,
            updatedAt: Date.now(),
        });

        return { raceId, code };
    },
});

export const joinRace = mutation({
    args: {
        code: v.string(),
        guestId: v.string(),
        guestUsername: v.string(),
    },
    handler: async (ctx, args) => {
        const race = await ctx.db
            .query('races')
            .withIndex('by_code', (q) => q.eq('code', args.code.toUpperCase()))
            .first();

        if (!race) {
            throw new Error('Room not found');
        }

        if (race.status !== 'waiting') {
            throw new Error('Race has already started');
        }

        if (race.guestId) {
            throw new Error('Room is full');
        }

        if (race.hostId === args.guestId) {
            throw new Error('Cannot join your own room');
        }

        await ctx.db.patch(race._id, {
            guestId: args.guestId,
            guestUsername: args.guestUsername,
        });

        await ctx.db.insert('raceProgress', {
            raceId: race._id,
            odId: args.guestId,
            charsTyped: 0,
            wpm: 0,
            finished: false,
            disconnected: false,
            updatedAt: Date.now(),
        });

        return { raceId: race._id, corpus: race.corpus };
    },
});

export const startCountdown = mutation({
    args: {
        raceId: v.id('races'),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const race = await ctx.db.get(args.raceId);

        if (!race) {
            throw new Error('Race not found');
        }

        if (race.hostId !== args.userId) {
            throw new Error('Only host can start the race');
        }

        if (!race.guestId) {
            throw new Error('Waiting for opponent to join');
        }

        if (race.status !== 'waiting') {
            throw new Error('Race has already started');
        }

        await ctx.db.patch(args.raceId, {
            status: 'countdown',
        });

        return { success: true };
    },
});

export const startRacing = mutation({
    args: {
        raceId: v.id('races'),
    },
    handler: async (ctx, args) => {
        const race = await ctx.db.get(args.raceId);

        if (!race) {
            throw new Error('Race not found');
        }

        if (race.status !== 'countdown') {
            throw new Error('Race is not in countdown');
        }

        await ctx.db.patch(args.raceId, {
            status: 'racing',
            startTime: Date.now(),
        });

        return { success: true, startTime: Date.now() };
    },
});

export const updateProgress = mutation({
    args: {
        raceId: v.id('races'),
        userId: v.string(),
        charsTyped: v.number(),
        wpm: v.number(),
    },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query('raceProgress')
            .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
            .filter((q) => q.eq(q.field('odId'), args.userId))
            .first();

        if (!progress) {
            throw new Error('Progress entry not found');
        }

        if (progress.finished || progress.disconnected) {
            return { success: false };
        }

        await ctx.db.patch(progress._id, {
            charsTyped: args.charsTyped,
            wpm: args.wpm,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const finishRace = mutation({
    args: {
        raceId: v.id('races'),
        userId: v.string(),
        finalWpm: v.number(),
        charsTyped: v.number(),
    },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query('raceProgress')
            .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
            .filter((q) => q.eq(q.field('odId'), args.userId))
            .first();

        if (!progress) {
            throw new Error('Progress entry not found');
        }

        await ctx.db.patch(progress._id, {
            charsTyped: args.charsTyped,
            wpm: args.finalWpm,
            finished: true,
            finishTime: Date.now(),
            updatedAt: Date.now(),
        });

        const allProgress = await ctx.db
            .query('raceProgress')
            .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
            .collect();

        const allFinished = allProgress.every((p) => p.finished || p.disconnected);

        if (allFinished) {
            await ctx.db.patch(args.raceId, {
                status: 'finished',
            });
        }

        return { success: true };
    },
});

export const leaveRace = mutation({
    args: {
        raceId: v.id('races'),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const race = await ctx.db.get(args.raceId);

        if (!race) {
            return { success: false };
        }

        const progress = await ctx.db
            .query('raceProgress')
            .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
            .filter((q) => q.eq(q.field('odId'), args.userId))
            .first();

        if (progress) {
            await ctx.db.patch(progress._id, {
                disconnected: true,
                updatedAt: Date.now(),
            });
        }

        if (race.status === 'waiting') {
            if (race.hostId === args.userId) {
                // Host left, delete the race
                const allProgress = await ctx.db
                    .query('raceProgress')
                    .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
                    .collect();

                for (const p of allProgress) {
                    await ctx.db.delete(p._id);
                }
                await ctx.db.delete(args.raceId);
            } else if (race.guestId === args.userId) {
                await ctx.db.patch(args.raceId, {
                    guestId: undefined,
                    guestUsername: undefined,
                });
            }
        }

        return { success: true };
    },
});

export const getRaceByCode = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('races')
            .withIndex('by_code', (q) => q.eq('code', args.code.toUpperCase()))
            .first();
    },
});

export const getRace = query({
    args: { raceId: v.id('races') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.raceId);
    },
});

export const getRaceProgress = query({
    args: { raceId: v.id('races') },
    handler: async (ctx, args) => {
        const progress = await ctx.db
            .query('raceProgress')
            .withIndex('by_race', (q) => q.eq('raceId', args.raceId))
            .collect();

        return progress;
    },
});
