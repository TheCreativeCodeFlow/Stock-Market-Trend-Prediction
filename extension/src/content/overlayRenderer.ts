// Overlay Renderer for TradingView
import { Insight, TrendDirection } from '../shared/types';

interface RenderOptions {
    showConfidence: boolean;
    showExplanation: boolean;
}

export class OverlayRenderer {
    private container: HTMLElement | null = null;
    private insightPanel: HTMLElement | null = null;
    private trendArrow: HTMLElement | null = null;

    constructor() {
        this.createContainer();
    }

    private createContainer(): void {
        // Create overlay container
        this.container = document.createElement('div');
        this.container.id = 'ai-copilot-overlay';
        this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
        document.body.appendChild(this.container);
    }

    render(insight: Insight, options: RenderOptions): void {
        if (!this.container) return;

        this.renderTrendArrow(insight.prediction);

        if (options.showConfidence || options.showExplanation) {
            this.renderInsightPanel(insight, options);
        }
    }

    hide(): void {
        if (this.trendArrow) {
            this.trendArrow.remove();
            this.trendArrow = null;
        }
        if (this.insightPanel) {
            this.insightPanel.remove();
            this.insightPanel = null;
        }
    }

    private renderTrendArrow(prediction: Insight['prediction']): void {
        // Remove existing arrow
        if (this.trendArrow) {
            this.trendArrow.remove();
        }

        // Find chart position for arrow placement
        const chartArea = this.findChartArea();
        if (!chartArea) return;

        this.trendArrow = document.createElement('div');
        this.trendArrow.className = 'ai-copilot-trend-arrow';

        const arrowConfig = this.getArrowConfig(prediction.direction);
        const confidenceColor = this.getConfidenceColor(prediction.confidence);

        this.trendArrow.innerHTML = `
      <div class="arrow-container" style="
        position: fixed;
        top: ${chartArea.top + 60}px;
        right: ${window.innerWidth - chartArea.right + 20}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: auto;
        cursor: pointer;
        padding: 8px 12px;
        background: rgba(20, 20, 30, 0.9);
        border-radius: 8px;
        border: 1px solid ${confidenceColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        transition: transform 0.2s ease;
      ">
        <div style="
          font-size: 28px;
          color: ${arrowConfig.color};
          text-shadow: 0 0 10px ${arrowConfig.color};
        ">${arrowConfig.symbol}</div>
        <div style="
          font-size: 11px;
          color: #a0a0a0;
          margin-top: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${arrowConfig.label}</div>
        <div style="
          font-size: 13px;
          font-weight: 600;
          color: ${confidenceColor};
          margin-top: 2px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">${prediction.confidence}%</div>
      </div>
    `;

        this.trendArrow.querySelector('.arrow-container')?.addEventListener('mouseenter', () => {
            const el = this.trendArrow?.querySelector('.arrow-container') as HTMLElement;
            if (el) el.style.transform = 'scale(1.05)';
        });

        this.trendArrow.querySelector('.arrow-container')?.addEventListener('mouseleave', () => {
            const el = this.trendArrow?.querySelector('.arrow-container') as HTMLElement;
            if (el) el.style.transform = 'scale(1)';
        });

        this.container?.appendChild(this.trendArrow);
    }

    private renderInsightPanel(insight: Insight, options: RenderOptions): void {
        // Remove existing panel
        if (this.insightPanel) {
            this.insightPanel.remove();
        }

        const chartArea = this.findChartArea();
        if (!chartArea) return;

        this.insightPanel = document.createElement('div');
        this.insightPanel.className = 'ai-copilot-insight-panel';

        const riskConfig = this.getRiskConfig(insight.riskLevel);

        this.insightPanel.innerHTML = `
      <div class="insight-container" style="
        position: fixed;
        top: ${chartArea.top + 140}px;
        right: ${window.innerWidth - chartArea.right + 20}px;
        width: 280px;
        pointer-events: auto;
        background: rgba(20, 20, 30, 0.95);
        border-radius: 12px;
        border: 1px solid rgba(100, 100, 120, 0.3);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      ">
        <div style="
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(60, 60, 80, 0.5), rgba(40, 40, 60, 0.5));
          border-bottom: 1px solid rgba(100, 100, 120, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <span style="font-size: 13px; font-weight: 600; color: #ffffff;">
            🤖 AI Insight
          </span>
          <span style="
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 4px;
            background: ${riskConfig.bg};
            color: ${riskConfig.color};
          ">
            ${riskConfig.label} Risk
          </span>
        </div>
        
        <div style="padding: 16px;">
          ${options.showConfidence ? this.renderProbabilities(insight.prediction) : ''}
          
          ${options.showExplanation ? `
            <div style="
              margin-top: 12px;
              padding: 12px;
              background: rgba(40, 40, 60, 0.5);
              border-radius: 8px;
              font-size: 12px;
              line-height: 1.5;
              color: #c0c0c0;
            ">
              ${insight.explanation}
            </div>
          ` : ''}
          
          ${insight.warnings.length > 0 ? `
            <div style="
              margin-top: 12px;
              padding: 10px;
              background: rgba(255, 180, 50, 0.1);
              border: 1px solid rgba(255, 180, 50, 0.3);
              border-radius: 8px;
              font-size: 11px;
              color: #ffb432;
            ">
              ⚠️ ${insight.warnings.join(' ')}
            </div>
          ` : ''}
        </div>
        
        <div style="
          padding: 8px 16px;
          font-size: 10px;
          color: #606060;
          text-align: center;
          border-top: 1px solid rgba(100, 100, 120, 0.2);
        ">
          Not financial advice • For educational purposes only
        </div>
      </div>
    `;

        this.container?.appendChild(this.insightPanel);
    }

    private renderProbabilities(prediction: Insight['prediction']): string {
        const items = [
            { label: 'Bullish', value: prediction.probabilities.bullish, color: '#22c55e' },
            { label: 'Bearish', value: prediction.probabilities.bearish, color: '#ef4444' },
            { label: 'Neutral', value: prediction.probabilities.neutral, color: '#a0a0a0' }
        ];

        return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${items.map(item => `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #808080; width: 50px;">${item.label}</span>
            <div style="
              flex: 1;
              height: 6px;
              background: rgba(60, 60, 80, 0.5);
              border-radius: 3px;
              overflow: hidden;
            ">
              <div style="
                width: ${item.value}%;
                height: 100%;
                background: ${item.color};
                border-radius: 3px;
                transition: width 0.3s ease;
              "></div>
            </div>
            <span style="
              font-size: 11px;
              font-weight: 600;
              color: ${item.color};
              width: 35px;
              text-align: right;
            ">${item.value}%</span>
          </div>
        `).join('')}
      </div>
    `;
    }

    private findChartArea(): DOMRect | null {
        const selectors = [
            '.chart-container',
            '[class*="chart-markup-table"]',
            '.tv-chart-container',
            'canvas'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.getBoundingClientRect();
            }
        }

        return null;
    }

    private getArrowConfig(direction: TrendDirection): { symbol: string; color: string; label: string } {
        const configs = {
            bullish: { symbol: '↑', color: '#22c55e', label: 'BULLISH' },
            bearish: { symbol: '↓', color: '#ef4444', label: 'BEARISH' },
            neutral: { symbol: '→', color: '#a0a0a0', label: 'NEUTRAL' }
        };
        return configs[direction];
    }

    private getConfidenceColor(confidence: number): string {
        if (confidence >= 70) return '#22c55e';
        if (confidence >= 50) return '#f59e0b';
        return '#ef4444';
    }

    private getRiskConfig(risk: Insight['riskLevel']): { bg: string; color: string; label: string } {
        const configs = {
            low: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Low' },
            medium: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Medium' },
            high: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'High' }
        };
        return configs[risk];
    }
}
