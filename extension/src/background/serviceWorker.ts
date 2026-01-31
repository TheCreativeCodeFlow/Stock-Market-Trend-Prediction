// Background Service Worker for AI Trading Co-Pilot
import { ExtensionMessage, Insight, ChartData, Settings, DEFAULT_SETTINGS } from '../shared/types';
import { ApiClient } from './apiClient';

class BackgroundService {
    private settings: Settings = DEFAULT_SETTINGS;
    private apiClient: ApiClient;
    private lastInsight: Insight | null = null;

    constructor() {
        this.apiClient = new ApiClient(this.settings.apiEndpoint);
        this.init();
    }

    private async init(): Promise<void> {
        // Load saved settings
        const stored = await chrome.storage.local.get('settings');
        if (stored.settings) {
            this.settings = { ...DEFAULT_SETTINGS, ...stored.settings };
            this.apiClient = new ApiClient(this.settings.apiEndpoint);
        }

        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        console.log('[AI Trading Co-Pilot] Background service initialized');
    }

    private handleMessage(
        message: ExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
    ): boolean {
        switch (message.type) {
            case 'ANALYZE_CHART':
                this.analyzeChart(message.payload as ChartData)
                    .then(sendResponse)
                    .catch((error) => sendResponse({ error: error.message }));
                return true; // Keep channel open for async response

            case 'GET_STATUS':
                sendResponse({
                    connected: this.apiClient.isConnected(),
                    lastInsight: this.lastInsight,
                    settings: this.settings
                });
                return false;

            case 'SETTINGS_UPDATE':
                this.updateSettings(message.payload as Partial<Settings>);
                sendResponse({ success: true });
                return false;

            default:
                return false;
        }
    }

    private async analyzeChart(chartData: ChartData): Promise<Insight> {
        try {
            const insight = await this.apiClient.analyze(chartData);
            this.lastInsight = insight;

            // Notify content script of new prediction
            this.broadcastToContentScripts({
                type: 'PREDICTION_RESULT',
                payload: insight,
                timestamp: Date.now()
            });

            return insight;
        } catch (error) {
            console.error('[AI Trading Co-Pilot] Analysis failed:', error);
            throw error;
        }
    }

    private async broadcastToContentScripts(message: ExtensionMessage): Promise<void> {
        const tabs = await chrome.tabs.query({ url: '*://*.tradingview.com/*' });
        for (const tab of tabs) {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, message).catch(() => {
                    // Tab may not have content script loaded
                });
            }
        }
    }

    private async updateSettings(newSettings: Partial<Settings>): Promise<void> {
        this.settings = { ...this.settings, ...newSettings };
        await chrome.storage.local.set({ settings: this.settings });

        if (newSettings.apiEndpoint) {
            this.apiClient = new ApiClient(this.settings.apiEndpoint);
        }
    }
}

// Initialize background service
new BackgroundService();
