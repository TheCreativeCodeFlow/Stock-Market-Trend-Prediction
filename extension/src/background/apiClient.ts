// API Client for backend communication with Demo Mode
import { ChartData, Insight, TrendDirection } from '../shared/types';

export class ApiClient {
    private baseUrl: string;
    private connected: boolean = false;
    private demoMode: boolean = true; // Enable demo mode by default

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.checkConnection();
    }

    isConnected(): boolean {
        return this.connected || this.demoMode;
    }

    isDemoMode(): boolean {
        return this.demoMode && !this.connected;
    }

    private async checkConnection(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            this.connected = response.ok;
            if (this.connected) {
                this.demoMode = false;
            }
        } catch {
            this.connected = false;
            this.demoMode = true;
        }
    }

    async analyze(chartData: ChartData, geminiApiKey?: string): Promise<Insight> {
        // Try backend first
        try {
            const requestBody = {
                ...chartData,
                gemini_api_key: geminiApiKey || undefined
            };

            const response = await fetch(`${this.baseUrl}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                this.connected = true;
                this.demoMode = false;
                return await response.json();
            }
        } catch {
            // Backend not available, use demo mode
        }

        // Demo mode - generate prediction from chart data
        this.connected = false;
        this.demoMode = true;
        return this.generateDemoPrediction(chartData);
    }

    private generateDemoPrediction(chartData: ChartData): Insight {
        const candles = chartData.candles;

        // Analyze recent candles for trend
        let bullishCount = 0;
        let bearishCount = 0;
        let momentum = 0;

        if (candles.length >= 2) {
            // Count bullish/bearish candles
            for (const candle of candles.slice(-10)) {
                if (candle.close > candle.open) {
                    bullishCount++;
                } else {
                    bearishCount++;
                }
            }

            // Calculate momentum
            const firstClose = candles[Math.max(0, candles.length - 10)].close;
            const lastClose = candles[candles.length - 1].close;
            momentum = (lastClose - firstClose) / firstClose;
        }

        // Determine direction
        let direction: TrendDirection;
        let confidence: number;

        if (momentum > 0.02 && bullishCount > bearishCount) {
            direction = 'bullish';
            confidence = Math.min(70 + bullishCount * 3, 85);
        } else if (momentum < -0.02 && bearishCount > bullishCount) {
            direction = 'bearish';
            confidence = Math.min(70 + bearishCount * 3, 85);
        } else {
            direction = 'neutral';
            confidence = 50;
        }

        // Calculate probabilities
        const total = bullishCount + bearishCount + 2;
        const bullishProb = Math.round((bullishCount + 1) / total * 100);
        const bearishProb = Math.round((bearishCount + 1) / total * 100);
        const neutralProb = 100 - bullishProb - bearishProb;

        // Generate explanation
        const explanation = this.generateExplanation(direction, confidence, bullishCount, bearishCount, momentum);

        return {
            prediction: {
                direction,
                confidence,
                probabilities: {
                    bullish: bullishProb,
                    bearish: bearishProb,
                    neutral: Math.max(neutralProb, 5)
                },
                timestamp: Date.now()
            },
            technicalAnalysis: {
                rsi: 50 + (momentum * 500), // Approximate RSI
            },
            explanation,
            riskLevel: confidence > 70 ? 'low' : confidence > 50 ? 'medium' : 'high',
            warnings: this.demoMode ? ['Demo mode - Backend server not connected'] : [],
            generatedAt: Date.now()
        };
    }

    private generateExplanation(
        direction: TrendDirection,
        confidence: number,
        bullishCount: number,
        bearishCount: number,
        momentum: number
    ): string {
        const momentumStr = momentum > 0 ? 'positive' : momentum < 0 ? 'negative' : 'neutral';
        const recentPattern = bullishCount > bearishCount ? 'bullish candles dominating' :
            bearishCount > bullishCount ? 'bearish candles dominating' : 'mixed signals';

        if (direction === 'bullish') {
            return `Recent price action shows ${recentPattern} with ${momentumStr} momentum. The upward trend suggests potential continuation. Confidence at ${confidence}%.`;
        } else if (direction === 'bearish') {
            return `Chart displays ${recentPattern} with ${momentumStr} momentum. Downward pressure indicates possible continuation. Confidence at ${confidence}%.`;
        } else {
            return `Market shows consolidation with ${recentPattern}. No clear directional bias detected. Consider waiting for clearer signals.`;
        }
    }

    async getNews(symbol: string): Promise<{ headlines: string[]; sentiment: number }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/news/${symbol}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                return response.json();
            }
        } catch {
            // Use demo data
        }

        return {
            headlines: [`${symbol} market analysis in progress`],
            sentiment: 0
        };
    }
}
