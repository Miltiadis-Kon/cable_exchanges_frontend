/**
 * GET /api/dates
 *
 * Returns all available dates for both cables and exchanges topics
 * from Vercel KV (Redis).
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const cableDates = await kv.smembers('cables:dates');
        const exchangeDates = await kv.smembers('exchanges:dates');

        return res.json({
            cables: (cableDates || []).sort(),
            exchanges: (exchangeDates || []).sort(),
        });
    } catch (err) {
        console.error('Error fetching dates:', err.message);
        return res.status(500).json({ cables: [], exchanges: [] });
    }
}
