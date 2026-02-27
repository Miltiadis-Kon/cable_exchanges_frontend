/**
 * GET /api/status
 *
 * Vercel Serverless Function that returns the current data
 * status from Vercel KV (Redis): available dates and last sync time.
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        const lastSyncAt = await kv.get('lastSyncAt');
        const cableDates = await kv.smembers('cables:dates');
        const exchangeDates = await kv.smembers('exchanges:dates');

        // Count total cached entries
        const totalEntries = (cableDates?.length || 0) + (exchangeDates?.length || 0);

        return res.json({
            status: 'ok',
            lastMessageAt: lastSyncAt || null,
            cachedEntries: totalEntries,
            availableDates: {
                cables: (cableDates || []).sort(),
                exchanges: (exchangeDates || []).sort(),
            },
        });
    } catch (err) {
        console.error('Error fetching status:', err.message);
        return res.status(500).json({
            status: 'error',
            error: err.message,
            lastMessageAt: null,
            cachedEntries: 0,
            availableDates: { cables: [], exchanges: [] },
        });
    }
}
