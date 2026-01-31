// Content Script Entry Point for TradingView
import { ScreenAnalyzer } from './screenAnalyzer';
import { DomParser } from './domParser';
import { OverlayRenderer } from './overlayRenderer';
import { ExtensionMessage, Insight, ChartData, Settings, DEFAULT_SETTINGS } from '../shared/types';

class TradingViewIntegration {
    private screenAnalyzer: ScreenAnalyzer;
    private domParser: DomParser;
    private overlayRenderer: OverlayRenderer;
    private settings: Settings = DEFAULT_SETTINGS;
    private analysisInterval: number | null = null;
    private isAnalyzing: boolean = false;

    constructor() {
        this.screenAnalyzer = new ScreenAnalyzer();
        this.domParser = new DomParser();
        this.overlayRenderer = new OverlayRenderer();

        this.init();
    }

    private async init(): Promise<void> {
        console.log('[AI Trading Co-Pilot] Content script loaded on TradingView');

        // Wait for chart to be ready
        await this.waitForChart();

        // Load settings
        await this.loadSettings();

        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Start auto-analysis if enabled
        if (this.settings.autoAnalyze) {
            this.startAutoAnalysis();
        }

        // Initial analysis
        this.triggerAnalysis();
    }

    private async waitForChart(): Promise<void> {
        return new Promise((resolve) => {
            const checkChart = () => {
                const chartContainer = document.querySelector('.chart-container, [class*="chart-markup-table"]');
                if (chartContainer) {
                    resolve();
                } else {
                    setTimeout(checkChart, 500);
                }
            };
            checkChart();
        });
    }

    private async loadSettings(): Promise<void> {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATUS',
                payload: null,
                timestamp: Date.now()
            });
            if (response?.settings) {
                this.settings = response.settings;
            }
        } catch (error) {
            console.warn('[AI Trading Co-Pilot] Could not load settings:', error);
        }
    }

    private handleMessage(
        message: ExtensionMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
    ): boolean {
        switch (message.type) {
            case 'PREDICTION_RESULT':
                this.displayInsight(message.payload as Insight);
                sendResponse({ received: true });
                return false;

            case 'SETTINGS_UPDATE':
                this.settings = { ...this.settings, ...(message.payload as Partial<Settings>) };
                this.handleSettingsChange();
                sendResponse({ success: true });
                return false;

            default:
                return false;
        }
    }

    private handleSettingsChange(): void {
        if (this.settings.autoAnalyze) {
            this.startAutoAnalysis();
        } else {
            this.stopAutoAnalysis();
        }

        if (!this.settings.overlayEnabled) {
            this.overlayRenderer.hide();
        }
    }

    private startAutoAnalysis(): void {
        if (this.analysisInterval) return;

        this.analysisInterval = window.setInterval(() => {
            this.triggerAnalysis();
        }, this.settings.analysisInterval * 1000);
    }

    private stopAutoAnalysis(): void {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }

    private async triggerAnalysis(): Promise<void> {
        if (this.isAnalyzing) return;
        this.isAnalyzing = true;

        try {
            // Extract chart data using DOM parsing and screen analysis
            const chartData = await this.extractChartData();

            if (chartData.candles.length === 0) {
                console.warn('[AI Trading Co-Pilot] No candle data found');
                return;
            }

            // Send to background for API call
            const message: ExtensionMessage<ChartData> = {
                type: 'ANALYZE_CHART',
                payload: chartData,
                timestamp: Date.now()
            };

            await chrome.runtime.sendMessage(message);
        } catch (error) {
            console.error('[AI Trading Co-Pilot] Analysis error:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    private async extractChartData(): Promise<ChartData> {
        // Use DOM parser for structured data
        const domData = this.domParser.parseChart();

        // Use screen analyzer for visual data
        const visualData = await this.screenAnalyzer.analyzeChart();

        // Merge data sources
        return {
            symbol: domData.symbol || visualData.symbol || 'UNKNOWN',
            timeframe: domData.timeframe || visualData.timeframe || '1D',
            candles: domData.candles.length > 0 ? domData.candles : visualData.candles,
            indicators: [...domData.indicators, ...visualData.indicators]
        };
    }

    private displayInsight(insight: Insight): void {
        if (!this.settings.overlayEnabled) return;

        this.overlayRenderer.render(insight, {
            showConfidence: this.settings.showConfidence,
            showExplanation: this.settings.showExplanation
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TradingViewIntegration());
} else {
    new TradingViewIntegration();
}
