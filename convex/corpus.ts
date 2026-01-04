import { query } from './_generated/server';

export const getCorpus = query({
    args: {},
    handler: async (ctx) => {
        const corpus = await ctx.db.query('corpus').first();
        return corpus;
    },
});
