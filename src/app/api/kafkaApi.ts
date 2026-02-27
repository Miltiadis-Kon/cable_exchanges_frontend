/**
 * Kafka API Client
 *
 * Functions to fetch cables and exchanges data from the Express
 * server's REST API. Used by the table components.
 */

export interface CableRecord {
    id: string;
    border: string;
    times: Record<string, number>;
}

export interface CableApiResponse {
    date: string;
    updated_at?: string;
    source: string;
    data: CableRecord[];
    available_dates?: string[];
}

export interface ExchangeHourData {
    time: string;
    [country: string]: string | number | null;
}

export interface ExchangeApiResponse {
    date: string;
    updated_at?: string;
    source: string;
    data: ExchangeHourData[];
    available_dates?: string[];
}

export interface KafkaStatus {
    status: string;
    lastMessageAt: string | null;
    cachedEntries: number;
    availableDates: {
        cables: string[];
        exchanges: string[];
    };
}

const API_BASE = '/api';

/**
 * Fetch cable auction data for a specific date.
 */
export async function fetchCableData(date: string): Promise<CableApiResponse> {
    const res = await fetch(`${API_BASE}/cables/${date}`);
    if (!res.ok) throw new Error(`Failed to fetch cable data: ${res.statusText}`);
    return res.json();
}

/**
 * Fetch exchange day-ahead market prices for a specific date.
 */
export async function fetchExchangeData(date: string): Promise<ExchangeApiResponse> {
    const res = await fetch(`${API_BASE}/exchanges/${date}`);
    if (!res.ok) throw new Error(`Failed to fetch exchange data: ${res.statusText}`);
    return res.json();
}

/**
 * Get Kafka consumer status and available dates.
 */
export async function fetchStatus(): Promise<KafkaStatus> {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
    return res.json();
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export function formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
