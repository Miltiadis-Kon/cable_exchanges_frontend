/**
 * Vercel Cron Job: Fetch Kafka Messages
 *
 * Runs on a schedule (configured in vercel.json), connects to Aiven Kafka,
 * reads latest messages from 'cables' and 'exchanges' topics,
 * stores them in Vercel KV (Redis), then disconnects.
 *
 * Schedule: every 3 hours (configurable in vercel.json)
 */

import { Kafka } from 'kafkajs';
import { kv } from '@vercel/kv';

function loadSSLCerts() {
    const ca = process.env.KAFKA_CA_B64;
    const cert = process.env.KAFKA_CERT_B64;
    const key = process.env.KAFKA_KEY_B64;

    if (!ca || !cert || !key) {
        throw new Error('Missing KAFKA_CA_B64, KAFKA_CERT_B64, or KAFKA_KEY_B64 env vars');
    }

    return {
        ca: Buffer.from(ca, 'base64').toString('utf-8'),
        cert: Buffer.from(cert, 'base64').toString('utf-8'),
        key: Buffer.from(key, 'base64').toString('utf-8'),
    };
}

export default async function handler(req, res) {
    // Verify the request is from Vercel Cron (security)
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const bootstrapServers =
        process.env.KAFKA_BOOTSTRAP_SERVERS ||
        'imbalance-greece-imbalancegrtable13.b.aivencloud.com:18883';

    const topics = (process.env.KAFKA_TOPICS || 'cables,exchanges').split(',').map((t) => t.trim());
    const groupId = process.env.KAFKA_GROUP_ID || 'power-market-vercel';

    let consumer;

    try {
        const ssl = loadSSLCerts();

        const kafka = new Kafka({
            clientId: 'power-market-vercel-cron',
            brokers: [bootstrapServers],
            ssl: {
                ca: [ssl.ca],
                cert: ssl.cert,
                key: ssl.key,
            },
            // Shorter timeouts for serverless environment
            connectionTimeout: 10000,
            requestTimeout: 15000,
        });

        consumer = kafka.consumer({ groupId });
        await consumer.connect();

        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: true });
        }

        let messageCount = 0;

        // Run the consumer with a timeout so the serverless function doesn't hang
        await Promise.race([
            consumer.run({
                eachMessage: async ({ topic, message }) => {
                    try {
                        const value = JSON.parse(message.value.toString());
                        const messageDate = value.date;

                        if (messageDate) {
                            const kvKey = `${topic}:${messageDate}`;
                            await kv.set(kvKey, JSON.stringify(value));

                            // Also track this date in the list of available dates
                            await kv.sadd(`${topic}:dates`, messageDate);

                            messageCount++;
                        }
                    } catch (err) {
                        console.error(`Error processing message from ${topic}:`, err.message);
                    }
                },
            }),
            // Wait up to 25 seconds then stop (Vercel functions have a ~30s limit on Hobby)
            new Promise((resolve) => setTimeout(resolve, 25000)),
        ]);

        // Update the last sync timestamp
        await kv.set('lastSyncAt', new Date().toISOString());

        await consumer.disconnect();

        return res.status(200).json({
            success: true,
            messagesProcessed: messageCount,
            syncedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Cron fetch-kafka error:', err.message);

        // Try to disconnect cleanly
        if (consumer) {
            try {
                await consumer.disconnect();
            } catch (_) {
                /* ignore */
            }
        }

        return res.status(500).json({ error: err.message });
    }
}
