/**
 * GET /api/exchanges/:date
 *
 * Vercel Serverless Function that reads exchange day-ahead
 * market prices for a given date from Vercel KV (Redis).
 */

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const { date } = req.query;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    try {
        const raw = await kv.get(`exchanges:${date}`);

        if (!raw) {
            const availableDates = await kv.smembers('exchanges:dates');
            return res.json({
                date,
                source: 'exchanges',
                data: [],
                available_dates: (availableDates || []).sort(),
            });
        }

        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return res.json(data);
    } catch (err) {
        console.error('Error fetching exchange data:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
