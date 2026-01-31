// API Client for backend communication
import { ChartData, Insight } from '../shared/types';

export class ApiClient {
    private baseUrl: string;
    private connected: boolean = false;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.checkConnection();
    }

    isConnected(): boolean {
        return this.connected;
    }

    private async checkConnection(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            this.connected = response.ok;
        } catch {
            this.connected = false;
        }
    }

    async analyze(chartData: ChartData): Promise<Insight> {
        const response = await fetch(`${this.baseUrl}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chartData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(error.message || `API error: ${response.status}`);
        }

        const insight: Insight = await response.json();
        this.connected = true;
        return insight;
    }

    async getNews(symbol: string): Promise<{ headlines: string[]; sentiment: number }> {
        const response = await fetch(`${this.baseUrl}/api/news/${symbol}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`News API error: ${response.status}`);
        }

        return response.json();
    }
}
