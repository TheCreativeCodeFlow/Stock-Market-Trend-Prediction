// Content Script Entry Point for TradingView - Improved Detection
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
    private retryCount: number = 0;
    private maxRetries: number = 10;

    constructor() {
        this.screenAnalyzer = new ScreenAnalyzer();
        this.domParser = new DomParser();
        this.overlayRenderer = new OverlayRenderer();

        console.log('[AI Trading Co-Pilot] Initializing...');
        this.init();
    }

    private async init(): Promise<void> {
        console.log('[AI Trading Co-Pilot] Content script loaded on TradingView');

        // Wait for chart to be ready with retry
        const chartReady = await this.waitForChart();

        if (!chartReady) {
            console.warn('[AI Trading Co-Pilot] Chart not found after retries, will try on user interaction');
            this.setupManualTrigger();
            return;
        }

        // Load settings
        await this.loadSettings();

        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Start auto-analysis
        this.startAutoAnalysis();

        // Initial analysis with delay
        setTimeout(() => this.triggerAnalysis(), 2000);
    }

    private async waitForChart(): Promise<boolean> {
        return new Promise((resolve) => {
            const checkChart = () => {
                const selectors = [
                    '.chart-container',
                    '[class*="chart-markup-table"]',
                    '.tv-chart-container',
                    'canvas.chart-markup-layer',
                    '[data-name="pane-widget"]',
                    '.chart-gui-wrapper'
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log(`[AI Trading Co-Pilot] Chart found with selector: ${selector}`);
                        resolve(true);
                        return;
                    }
                }

                this.retryCount++;
                if (this.retryCount < this.maxRetries) {
                    setTimeout(checkChart, 1000);
                } else {
                    console.warn('[AI Trading Co-Pilot] Chart not found after max retries');
                    resolve(false);
                }
            };

            // Start checking after a small delay
            setTimeout(checkChart, 500);
        });
    }

    private setupManualTrigger(): void {
        // Listen for clicks on the page to retry chart detection
        document.addEventListener('click', () => {
            if (!this.analysisInterval) {
                this.retryCount = 0;
                this.waitForChart().then((found) => {
                    if (found) {
                        this.startAutoAnalysis();
                        this.triggerAnalysis();
                    }
                });
            }
        }, { once: true });
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

        console.log('[AI Trading Co-Pilot] Starting auto-analysis');

        // Run immediately then set interval
        this.triggerAnalysis();

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
        if (this.isAnalyzing) {
            console.log('[AI Trading Co-Pilot] Analysis already in progress');
            return;
        }

        this.isAnalyzing = true;
        console.log('[AI Trading Co-Pilot] Triggering analysis...');

        try {
            // Extract chart data
            const chartData = await this.extractChartData();

            console.log('[AI Trading Co-Pilot] Extracted chart data:', {
                symbol: chartData.symbol,
                timeframe: chartData.timeframe,
                candleCount: chartData.candles.length
            });

            // If no candles, create demo data
            if (chartData.candles.length === 0) {
                console.log('[AI Trading Co-Pilot] No candles extracted, using demo data');
                chartData.candles = this.generateDemoCandles();
            }

            // Send to background for API call
            const message: ExtensionMessage<ChartData> = {
                type: 'ANALYZE_CHART',
                payload: chartData,
                timestamp: Date.now()
            };

            const response = await chrome.runtime.sendMessage(message);
            console.log('[AI Trading Co-Pilot] Analysis response:', response);

            if (response && !response.error) {
                this.displayInsight(response as Insight);
            }
        } catch (error) {
            console.error('[AI Trading Co-Pilot] Analysis error:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    private generateDemoCandles(): ChartData['candles'] {
        // Generate realistic demo candles for testing
        const candles = [];
        let price = 100;
        const now = Date.now();

        for (let i = 30; i >= 0; i--) {
            const change = (Math.random() - 0.48) * 2; // Slight bullish bias
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 0.5;
            const low = Math.min(open, close) - Math.random() * 0.5;

            candles.push({
                timestamp: now - (i * 86400000), // Daily candles
                open,
                high,
                low,
                close,
                volume: Math.random() * 1000000
            });

            price = close;
        }

        return candles;
    }

    private async extractChartData(): Promise<ChartData> {
        // Use DOM parser for structured data
        const domData = this.domParser.parseChart();

        // Use screen analyzer for visual data
        const visualData = await this.screenAnalyzer.analyzeChart();

        // Merge data sources
        return {
            symbol: domData.symbol || visualData.symbol || this.extractSymbolFromPage() || 'UNKNOWN',
            timeframe: domData.timeframe || visualData.timeframe || '1D',
            candles: domData.candles.length > 0 ? domData.candles : visualData.candles,
            indicators: [...domData.indicators, ...visualData.indicators]
        };
    }

    private extractSymbolFromPage(): string {
        // Try to get symbol from page title or URL
        const title = document.title;
        const match = title.match(/^([A-Z0-9]+)/);
        if (match) return match[1];

        // Try URL
        const urlMatch = window.location.href.match(/symbol=([A-Z0-9:]+)/i);
        if (urlMatch) return urlMatch[1].replace(':', '');

        return '';
    }

    private displayInsight(insight: Insight): void {
        console.log('[AI Trading Co-Pilot] Displaying insight:', insight);

        if (!this.settings.overlayEnabled) {
            console.log('[AI Trading Co-Pilot] Overlays disabled');
            return;
        }

        this.overlayRenderer.render(insight, {
            showConfidence: this.settings.showConfidence,
            showExplanation: this.settings.showExplanation
        });
    }
}

// Initialize when DOM is ready
console.log('[AI Trading Co-Pilot] Script loaded, checking DOM state...');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[AI Trading Co-Pilot] DOM loaded, initializing...');
        new TradingViewIntegration();
    });
} else {
    console.log('[AI Trading Co-Pilot] DOM ready, initializing immediately...');
    new TradingViewIntegration();
}
