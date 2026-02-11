// Popup Script for AI Trading Co-Pilot
// External script file to avoid CSP issues with inline scripts

document.addEventListener('DOMContentLoaded', function () {
    console.log('[AI Trading Co-Pilot] Popup script loaded');

    // Tab switching
    const statusTab = document.getElementById('statusTab');
    const settingsTab = document.getElementById('settingsTab');
    const statusPanel = document.getElementById('statusPanel');
    const settingsPanel = document.getElementById('settingsPanel');

    if (statusTab) {
        statusTab.addEventListener('click', function () {
            console.log('Switching to Status tab');
            statusTab.classList.add('active');
            settingsTab.classList.remove('active');
            statusPanel.classList.remove('hidden');
            settingsPanel.classList.add('hidden');
        });
    }

    if (settingsTab) {
        settingsTab.addEventListener('click', function () {
            console.log('Switching to Settings tab');
            settingsTab.classList.add('active');
            statusTab.classList.remove('active');
            settingsPanel.classList.remove('hidden');
            statusPanel.classList.add('hidden');
        });
    }

    // Load status from background
    loadStatus();

    // Add listeners to settings inputs
    const settingInputs = document.querySelectorAll('.setting-input, .setting-toggle input');
    settingInputs.forEach(function (el) {
        el.addEventListener('change', saveSettings);
    });
});

async function loadStatus() {
    try {
        console.log('[AI Trading Co-Pilot] Loading status...');
        const response = await chrome.runtime.sendMessage({
            type: 'GET_STATUS',
            payload: null,
            timestamp: Date.now()
        });

        console.log('[AI Trading Co-Pilot] Status response:', response);

        if (response) {
            // Update status badge
            const badge = document.getElementById('statusBadge');
            if (badge) {
                if (response.demoMode) {
                    badge.className = 'status-badge demo';
                    badge.textContent = '◐ Demo';
                } else if (response.connected) {
                    badge.className = 'status-badge connected';
                    badge.textContent = '● Online';
                } else {
                    badge.className = 'status-badge disconnected';
                    badge.textContent = '○ Offline';
                }
            }

            // Update settings
            if (response.settings) {
                const apiEndpoint = document.getElementById('apiEndpoint');
                const geminiApiKey = document.getElementById('geminiApiKey');
                const autoAnalyze = document.getElementById('autoAnalyze');
                const overlayEnabled = document.getElementById('overlayEnabled');
                const showConfidence = document.getElementById('showConfidence');
                const showExplanation = document.getElementById('showExplanation');
                const analysisInterval = document.getElementById('analysisInterval');

                if (apiEndpoint) apiEndpoint.value = response.settings.apiEndpoint || 'http://localhost:8000';
                if (geminiApiKey) geminiApiKey.value = response.settings.geminiApiKey || '';
                if (autoAnalyze) autoAnalyze.checked = response.settings.autoAnalyze !== false;
                if (overlayEnabled) overlayEnabled.checked = response.settings.overlayEnabled !== false;
                if (showConfidence) showConfidence.checked = response.settings.showConfidence !== false;
                if (showExplanation) showExplanation.checked = response.settings.showExplanation !== false;
                if (analysisInterval) analysisInterval.value = response.settings.analysisInterval || 60;
            }

            // Update prediction display
            if (response.lastInsight) {
                showPrediction(response.lastInsight);
            }
        }
    } catch (error) {
        console.error('[AI Trading Co-Pilot] Failed to load status:', error);
    }
}

function showPrediction(insight) {
    const emptyState = document.getElementById('emptyState');
    const predictionDisplay = document.getElementById('predictionDisplay');

    if (emptyState) emptyState.classList.add('hidden');
    if (predictionDisplay) predictionDisplay.classList.remove('hidden');

    const prediction = insight.prediction;

    // Direction arrow
    const arrow = document.getElementById('directionArrow');
    if (arrow) {
        arrow.className = 'direction-arrow ' + prediction.direction;
        arrow.textContent = prediction.direction === 'bullish' ? '↑' :
            prediction.direction === 'bearish' ? '↓' : '→';
    }

    // Labels
    const directionLabel = document.getElementById('directionLabel');
    const confidenceValue = document.getElementById('confidenceValue');
    const predictionTime = document.getElementById('predictionTime');

    if (directionLabel) directionLabel.textContent = prediction.direction.toUpperCase();
    if (confidenceValue) confidenceValue.textContent = prediction.confidence.toFixed(1) + '% confidence';
    if (predictionTime) predictionTime.textContent = new Date(insight.generatedAt).toLocaleTimeString();

    // Probabilities
    const probs = prediction.probabilities;
    const bullishBar = document.getElementById('bullishBar');
    const bullishValue = document.getElementById('bullishValue');
    const bearishBar = document.getElementById('bearishBar');
    const bearishValue = document.getElementById('bearishValue');
    const neutralBar = document.getElementById('neutralBar');
    const neutralValue = document.getElementById('neutralValue');

    if (bullishBar) bullishBar.style.width = probs.bullish + '%';
    if (bullishValue) bullishValue.textContent = probs.bullish + '%';
    if (bearishBar) bearishBar.style.width = probs.bearish + '%';
    if (bearishValue) bearishValue.textContent = probs.bearish + '%';
    if (neutralBar) neutralBar.style.width = probs.neutral + '%';
    if (neutralValue) neutralValue.textContent = probs.neutral + '%';

    // Risk badge
    const riskBadge = document.getElementById('riskBadge');
    if (riskBadge) {
        riskBadge.className = 'risk-badge risk-' + insight.riskLevel;
        riskBadge.textContent = insight.riskLevel.toUpperCase() + ' RISK';
    }

    // Explanation
    const explanationText = document.getElementById('explanationText');
    if (explanationText) explanationText.textContent = insight.explanation;
}

async function saveSettings() {
    const apiEndpoint = document.getElementById('apiEndpoint');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const autoAnalyze = document.getElementById('autoAnalyze');
    const overlayEnabled = document.getElementById('overlayEnabled');
    const showConfidence = document.getElementById('showConfidence');
    const showExplanation = document.getElementById('showExplanation');
    const analysisInterval = document.getElementById('analysisInterval');

    const settings = {
        apiEndpoint: apiEndpoint ? apiEndpoint.value : 'http://localhost:8000',
        geminiApiKey: geminiApiKey ? geminiApiKey.value : '',
        autoAnalyze: autoAnalyze ? autoAnalyze.checked : true,
        overlayEnabled: overlayEnabled ? overlayEnabled.checked : true,
        showConfidence: showConfidence ? showConfidence.checked : true,
        showExplanation: showExplanation ? showExplanation.checked : true,
        analysisInterval: analysisInterval ? parseInt(analysisInterval.value) || 60 : 60
    };

    try {
        await chrome.runtime.sendMessage({
            type: 'SETTINGS_UPDATE',
            payload: settings,
            timestamp: Date.now()
        });
        console.log('[AI Trading Co-Pilot] Settings saved');
    } catch (error) {
        console.error('[AI Trading Co-Pilot] Failed to save settings:', error);
    }
}
