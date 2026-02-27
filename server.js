/**
 * Express Server + Kafka Consumer
 *
 * Entry point for the Power Market Price Preview service.
 * - Starts a KafkaJS consumer to read cables & exchanges topics
 * - Serves REST API endpoints for the frontend
 * - In production, serves the built Vite frontend from dist/
 *
 * Usage:
 *   Development:  node server.js
 *   Production:   npm run build && node server.js
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import {
    startConsumer,
    stopConsumer,
    getDataForDate,
    getAvailableDates,
    getStatus,
} from './kafka-consumer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────

/**
 * GET /api/status
 * Returns Kafka consumer status and available dates.
 */
app.get('/api/status', (req, res) => {
    res.json(getStatus());
});

/**
 * GET /api/cables/:date
 * Returns cable auction data for the specified date (YYYY-MM-DD).
 */
app.get('/api/cables/:date', (req, res) => {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const message = getDataForDate('cables', date);

    if (!message) {
        return res.json({
            date,
            source: 'cables',
            data: [],
            available_dates: getAvailableDates('cables'),
        });
    }

    res.json(message);
});

/**
 * GET /api/exchanges/:date
 * Returns exchange day-ahead market prices for the specified date (YYYY-MM-DD).
 */
app.get('/api/exchanges/:date', (req, res) => {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const message = getDataForDate('exchanges', date);

    if (!message) {
        return res.json({
            date,
            source: 'exchanges',
            data: [],
            available_dates: getAvailableDates('exchanges'),
        });
    }

    res.json(message);
});

/**
 * GET /api/dates
 * Returns all available dates for both topics.
 */
app.get('/api/dates', (req, res) => {
    res.json({
        cables: getAvailableDates('cables'),
        exchanges: getAvailableDates('exchanges'),
    });
});

// ── Serve Frontend (Production) ─────────────────────────────

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
    }
});

// ── Start Server ────────────────────────────────────────────

async function start() {
    // Start Kafka consumer first
    await startConsumer();

    // Then start Express
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`   API: http://localhost:${PORT}/api/status`);
        console.log(`   Frontend: http://localhost:${PORT}\n`);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await stopConsumer();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await stopConsumer();
    process.exit(0);
});

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
