import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

async function pingDatabase() {
    const { data, error } = await supabase.from('corpus').select('words').limit(1);

    if (error) {
        console.error('Error pinging database', error);
        throw error;
    } else {
        console.log('Database pinged successfully', data);
    }
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    const authHeader = request.headers.authorization;
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
        return response.status(401).json({ 
            success: false, 
            message: 'Unauthorized'
        });
    }

    try {
        await pingDatabase();
        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('Cron job ping failed', error);
        return response
            .status(500)
            .json({ success: false, message: 'Failed to ping database' });
    }
}