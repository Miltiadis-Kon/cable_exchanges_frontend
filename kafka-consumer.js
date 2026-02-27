/**
 * Kafka Consumer Module
 *
 * Connects to Aiven Kafka via SSL and consumes messages from
 * 'cables' and 'exchanges' topics. Caches messages in-memory
 * indexed by (topic, date) for fast lookups.
 *
 * SSL certs can be loaded from:
 *   1. File paths (local dev): KAFKA_CA_PATH, KAFKA_CERT_PATH, KAFKA_KEY_PATH
 *   2. Base64 env vars (Render deploy): KAFKA_CA_B64, KAFKA_CERT_B64, KAFKA_KEY_B64
 */

import { Kafka } from 'kafkajs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Data Store ──────────────────────────────────────────────

// Map<string, object> keyed by "topic:date", e.g. "cables:2026-02-28"
const dataStore = new Map();
let consumerStatus = 'disconnected';
let lastMessageAt = null;

// ── SSL Certificate Loading ─────────────────────────────────

function loadSSLCerts() {
    // Option 1: Base64 environment variables (for Render / cloud deployment)
    if (process.env.KAFKA_CA_B64 && process.env.KAFKA_CERT_B64 && process.env.KAFKA_KEY_B64) {
        return {
            ca: Buffer.from(process.env.KAFKA_CA_B64, 'base64').toString('utf-8'),
            cert: Buffer.from(process.env.KAFKA_CERT_B64, 'base64').toString('utf-8'),
            key: Buffer.from(process.env.KAFKA_KEY_B64, 'base64').toString('utf-8'),
        };
    }

    // Option 2: File paths (local development)
    const certsDir = process.env.KAFKA_CERTS_DIR || path.resolve(__dirname, '..', 'certs');
    const caPath = process.env.KAFKA_CA_PATH || path.join(certsDir, 'ca.pem');
    const certPath = process.env.KAFKA_CERT_PATH || path.join(certsDir, 'service.cert');
    const keyPath = process.env.KAFKA_KEY_PATH || path.join(certsDir, 'service.key');

    if (!fs.existsSync(caPath) || !fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.error('❌ SSL certificate files not found. Set KAFKA_CA_B64/KAFKA_CERT_B64/KAFKA_KEY_B64 env vars or place certs in ../certs/');
        return null;
    }

    return {
        ca: fs.readFileSync(caPath, 'utf-8'),
        cert: fs.readFileSync(certPath, 'utf-8'),
        key: fs.readFileSync(keyPath, 'utf-8'),
    };
}

// ── Consumer ────────────────────────────────────────────────

let kafkaConsumer = null;

export async function startConsumer() {
    const bootstrapServers = process.env.KAFKA_BOOTSTRAP_SERVERS
        || 'imbalance-greece-imbalancegrtable13.b.aivencloud.com:18883';

    const topics = (process.env.KAFKA_TOPICS || 'cables,exchanges').split(',');
    const groupId = process.env.KAFKA_GROUP_ID || 'power-market-preview';

    const ssl = loadSSLCerts();
    if (!ssl) {
        consumerStatus = 'error: missing SSL certs';
        return;
    }

    const kafka = new Kafka({
        clientId: 'power-market-frontend',
        brokers: [bootstrapServers],
        ssl: {
            ca: [ssl.ca],
            cert: ssl.cert,
            key: ssl.key,
        },
    });

    kafkaConsumer = kafka.consumer({ groupId });

    try {
        console.log(`🔌 Connecting to Kafka at ${bootstrapServers}...`);
        await kafkaConsumer.connect();
        consumerStatus = 'connected';
        console.log('✅ Connected to Kafka');

        for (const topic of topics) {
            await kafkaConsumer.subscribe({ topic: topic.trim(), fromBeginning: true });
            console.log(`📡 Subscribed to topic: ${topic.trim()}`);
        }

        await kafkaConsumer.run({
            eachMessage: async ({ topic, message }) => {
                try {
                    const value = JSON.parse(message.value.toString());
                    const messageDate = value.date;

                    if (messageDate) {
                        const key = `${topic}:${messageDate}`;
                        dataStore.set(key, value);
                        lastMessageAt = new Date().toISOString();
                        console.log(`📥 Cached: ${key} (updated_at: ${value.updated_at || 'N/A'})`);
                    }
                } catch (err) {
                    console.error(`Error parsing message from ${topic}:`, err.message);
                }
            },
        });
    } catch (err) {
        consumerStatus = `error: ${err.message}`;
        console.error('❌ Failed to start Kafka consumer:', err.message);
    }
}

export async function stopConsumer() {
    if (kafkaConsumer) {
        await kafkaConsumer.disconnect();
        consumerStatus = 'disconnected';
        console.log('🔌 Kafka consumer disconnected');
    }
}

// ── Data Access ─────────────────────────────────────────────

/**
 * Get data for a specific topic and date.
 * @param {string} topic - 'cables' or 'exchanges'
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {object|null} The cached message payload or null
 */
export function getDataForDate(topic, date) {
    return dataStore.get(`${topic}:${date}`) || null;
}

/**
 * Get all available dates for a topic.
 * @param {string} topic - 'cables' or 'exchanges'
 * @returns {string[]} Array of date strings
 */
export function getAvailableDates(topic) {
    const dates = [];
    for (const key of dataStore.keys()) {
        if (key.startsWith(`${topic}:`)) {
            dates.push(key.split(':')[1]);
        }
    }
    return dates.sort();
}

/**
 * Get consumer status info.
 */
export function getStatus() {
    return {
        status: consumerStatus,
        lastMessageAt,
        cachedEntries: dataStore.size,
        availableDates: {
            cables: getAvailableDates('cables'),
            exchanges: getAvailableDates('exchanges'),
        },
    };
}
