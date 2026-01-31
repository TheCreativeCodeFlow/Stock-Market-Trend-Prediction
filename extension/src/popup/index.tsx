import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, DEFAULT_SETTINGS, Insight } from '../shared/types';
import './popup.css';

interface StatusInfo {
    connected: boolean;
    lastInsight: Insight | null;
    settings: Settings;
}

const Popup: React.FC = () => {
    const [status, setStatus] = useState<StatusInfo | null>(null);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status');

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATUS',
                payload: null,
                timestamp: Date.now()
            });
            setStatus(response);
            if (response?.settings) {
                setSettings(response.settings);
            }
        } catch (error) {
            console.error('Failed to load status:', error);
        }
    };

    const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        await chrome.runtime.sendMessage({
            type: 'SETTINGS_UPDATE',
            payload: newSettings,
            timestamp: Date.now()
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="popup-container">
            <header className="popup-header">
                <div className="logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">AI Trading Co-Pilot</span>
                </div>
                <div className={`status-badge ${status?.connected ? 'connected' : 'disconnected'}`}>
                    {status?.connected ? '● Online' : '○ Offline'}
                </div>
            </header>

            <nav className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                >
                    Status
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </nav>

            <main className="popup-content">
                {activeTab === 'status' && (
                    <div className="status-panel">
                        {status?.lastInsight ? (
                            <>
                                <div className="insight-card">
                                    <div className="insight-header">
                                        <span className="insight-title">Latest Prediction</span>
                                        <span className="insight-time">
                                            {formatTime(status.lastInsight.generatedAt)}
                                        </span>
                                    </div>

                                    <div className="prediction-display">
                                        <div className={`direction-arrow ${status.lastInsight.prediction.direction}`}>
                                            {status.lastInsight.prediction.direction === 'bullish' ? '↑' :
                                                status.lastInsight.prediction.direction === 'bearish' ? '↓' : '→'}
                                        </div>
                                        <div className="prediction-info">
                                            <div className="direction-label">
                                                {status.lastInsight.prediction.direction.toUpperCase()}
                                            </div>
                                            <div className="confidence-value">
                                                {status.lastInsight.prediction.confidence}% confidence
                                            </div>
                                        </div>
                                    </div>

                                    <div className="probabilities">
                                        <ProbabilityBar label="Bullish" value={status.lastInsight.prediction.probabilities.bullish} color="#22c55e" />
                                        <ProbabilityBar label="Bearish" value={status.lastInsight.prediction.probabilities.bearish} color="#ef4444" />
                                        <ProbabilityBar label="Neutral" value={status.lastInsight.prediction.probabilities.neutral} color="#a0a0a0" />
                                    </div>

                                    <div className={`risk-badge risk-${status.lastInsight.riskLevel}`}>
                                        {status.lastInsight.riskLevel.toUpperCase()} RISK
                                    </div>
                                </div>

                                <div className="explanation-card">
                                    <div className="explanation-title">AI Explanation</div>
                                    <p className="explanation-text">{status.lastInsight.explanation}</p>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <div className="empty-title">No Predictions Yet</div>
                                <p className="empty-text">
                                    Open TradingView to start receiving AI-powered trend predictions.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-panel">
                        <div className="setting-group">
                            <label className="setting-label">API Endpoint</label>
                            <input
                                type="text"
                                className="setting-input"
                                value={settings.apiEndpoint}
                                onChange={(e) => updateSetting('apiEndpoint', e.target.value)}
                                placeholder="http://localhost:8000"
                            />
                        </div>

                        <div className="setting-group">
                            <label className="setting-toggle">
                                <span>Auto-Analyze Charts</span>
                                <input
                                    type="checkbox"
                                    checked={settings.autoAnalyze}
                                    onChange={(e) => updateSetting('autoAnalyze', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-group">
                            <label className="setting-toggle">
                                <span>Show Overlays</span>
                                <input
                                    type="checkbox"
                                    checked={settings.overlayEnabled}
                                    onChange={(e) => updateSetting('overlayEnabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-group">
                            <label className="setting-toggle">
                                <span>Show Confidence</span>
                                <input
                                    type="checkbox"
                                    checked={settings.showConfidence}
                                    onChange={(e) => updateSetting('showConfidence', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-group">
                            <label className="setting-toggle">
                                <span>Show Explanations</span>
                                <input
                                    type="checkbox"
                                    checked={settings.showExplanation}
                                    onChange={(e) => updateSetting('showExplanation', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-group">
                            <label className="setting-label">Analysis Interval (seconds)</label>
                            <input
                                type="number"
                                className="setting-input"
                                value={settings.analysisInterval}
                                onChange={(e) => updateSetting('analysisInterval', parseInt(e.target.value) || 60)}
                                min="10"
                                max="300"
                            />
                        </div>
                    </div>
                )}
            </main>

            <footer className="popup-footer">
                <span>Not financial advice</span>
                <span>•</span>
                <span>v1.0.0</span>
            </footer>
        </div>
    );
};

const ProbabilityBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="prob-bar">
        <span className="prob-label">{label}</span>
        <div className="prob-track">
            <div className="prob-fill" style={{ width: `${value}%`, backgroundColor: color }}></div>
        </div>
        <span className="prob-value" style={{ color }}>{value}%</span>
    </div>
);

// Initialize React app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
}
