import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, DEFAULT_SETTINGS, Insight } from '../shared/types';
import './popup.css';

interface StatusInfo {
    connected: boolean;
    demoMode?: boolean;
    lastInsight: Insight | null;
    settings: Settings;
}

const Popup: React.FC = () => {
    const [status, setStatus] = useState<StatusInfo | null>(null);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [activeTab, setActiveTab] = useState<'status' | 'settings'>('status');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATUS',
                payload: null,
                timestamp: Date.now()
            });
            console.log('Popup received status:', response);
            if (response) {
                setStatus(response);
                if (response.settings) {
                    setSettings(response.settings);
                }
            }
        } catch (err) {
            console.error('Failed to load status:', err);
            setError('Failed to connect to extension');
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await chrome.runtime.sendMessage({
                type: 'SETTINGS_UPDATE',
                payload: newSettings,
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Failed to update settings:', err);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getConnectionLabel = () => {
        if (status?.connected && !status?.demoMode) return '● Online';
        if (status?.demoMode) return '◐ Demo';
        return '○ Offline';
    };

    const getConnectionClass = () => {
        if (status?.connected && !status?.demoMode) return 'connected';
        if (status?.demoMode) return 'demo';
        return 'disconnected';
    };

    if (loading) {
        return (
            <div className="popup-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="popup-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">{error}</div>
                    <button className="retry-btn" onClick={loadStatus}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="popup-container">
            <header className="popup-header">
                <div className="logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">AI Trading Co-Pilot</span>
                </div>
                <div className={`status-badge ${getConnectionClass()}`}>
                    {getConnectionLabel()}
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
                                                {status.lastInsight.prediction.confidence.toFixed(1)}% confidence
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

                                {status.lastInsight.warnings && status.lastInsight.warnings.length > 0 && (
                                    <div className="warnings-card">
                                        {status.lastInsight.warnings.map((warning, i) => (
                                            <div key={i} className="warning-item">⚠️ {warning}</div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <div className="empty-title">No Predictions Yet</div>
                                <p className="empty-text">
                                    Open TradingView to start receiving AI-powered trend predictions.
                                </p>
                                {status?.demoMode && (
                                    <div className="demo-notice">
                                        Running in demo mode (backend not connected)
                                    </div>
                                )}
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

// Initialize React app with error handling
try {
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(<Popup />);
        console.log('[AI Trading Co-Pilot] Popup rendered successfully');
    } else {
        console.error('[AI Trading Co-Pilot] Root container not found');
    }
} catch (err) {
    console.error('[AI Trading Co-Pilot] Failed to render popup:', err);
}
