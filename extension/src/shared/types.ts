// Shared type definitions for AI Trading Co-Pilot

export interface Candle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ChartData {
    symbol: string;
    timeframe: string;
    candles: Candle[];
    indicators: IndicatorData[];
}

export interface IndicatorData {
    name: string;
    type: 'momentum' | 'trend' | 'volume' | 'volatility';
    values: number[];
}

export type TrendDirection = 'bullish' | 'bearish' | 'neutral';

export interface Prediction {
    direction: TrendDirection;
    confidence: number; // 0-100
    probabilities: {
        bullish: number;
        bearish: number;
        neutral: number;
    };
    timestamp: number;
}

export interface TechnicalAnalysis {
    rsi?: number;
    macd?: {
        macd: number;
        signal: number;
        histogram: number;
    };
    ema?: { [period: number]: number };
    sma?: { [period: number]: number };
    volumeAnalysis?: {
        trend: 'increasing' | 'decreasing' | 'stable';
        ratio: number;
    };
}

export interface NewsSentiment {
    sentiment: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    headlines: string[];
    score: number; // -1 to 1
}

export interface Insight {
    prediction: Prediction;
    technicalAnalysis: TechnicalAnalysis;
    sentiment?: NewsSentiment;
    explanation: string;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
    generatedAt: number;
}

// Message types for extension communication
export type MessageType =
    | 'ANALYZE_CHART'
    | 'PREDICTION_RESULT'
    | 'GET_STATUS'
    | 'STATUS_UPDATE'
    | 'SETTINGS_UPDATE'
    | 'ERROR';

export interface ExtensionMessage<T = unknown> {
    type: MessageType;
    payload: T;
    timestamp: number;
}

export interface Settings {
    apiEndpoint: string;
    autoAnalyze: boolean;
    overlayEnabled: boolean;
    showConfidence: boolean;
    showExplanation: boolean;
    analysisInterval: number; // seconds
}

export const DEFAULT_SETTINGS: Settings = {
    apiEndpoint: 'http://localhost:8000',
    autoAnalyze: true,
    overlayEnabled: true,
    showConfidence: true,
    showExplanation: true,
    analysisInterval: 60
};
