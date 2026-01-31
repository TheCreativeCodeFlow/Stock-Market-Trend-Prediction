// DOM Parser for TradingView chart data extraction
import { Candle, ChartData, IndicatorData } from '../shared/types';

export class DomParser {
    parseChart(): ChartData {
        return {
            symbol: this.extractSymbol(),
            timeframe: this.extractTimeframe(),
            candles: this.extractCandles(),
            indicators: this.extractIndicators()
        };
    }

    private extractSymbol(): string {
        // Try multiple selectors for symbol extraction
        const selectors = [
            '[data-symbol-full]',
            '.tv-symbol-header__text',
            '[class*="symbolTitle"]',
            '.chart-widget__symbol',
            'title'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const symbol = element.getAttribute('data-symbol-full')
                    || element.textContent?.split(' ')[0]?.trim();
                if (symbol && symbol.length > 0 && symbol.length < 20) {
                    return symbol.replace(/[^A-Z0-9:]/gi, '');
                }
            }
        }

        // Try extracting from page title
        const title = document.title;
        const match = title.match(/^([A-Z0-9]+)/);
        return match ? match[1] : 'UNKNOWN';
    }

    private extractTimeframe(): string {
        const selectors = [
            '[data-name="intervals-tab"] .selected',
            '.chart-toolbar-resolution button.isActive',
            '[class*="resolution"] [class*="active"]',
            '[data-resolution].active'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element?.textContent) {
                return element.textContent.trim();
            }
        }

        return '1D';
    }

    private extractCandles(): Candle[] {
        const candles: Candle[] = [];

        // Method 1: Try to extract from data window/tooltip
        const dataWindow = this.extractFromDataWindow();
        if (dataWindow.length > 0) {
            return dataWindow;
        }

        // Method 2: Parse from canvas/SVG elements
        const visualCandles = this.extractFromVisualElements();
        if (visualCandles.length > 0) {
            return visualCandles;
        }

        // Method 3: Try to intercept chart data from global objects
        const interceptedData = this.interceptChartData();
        if (interceptedData.length > 0) {
            return interceptedData;
        }

        return candles;
    }

    private extractFromDataWindow(): Candle[] {
        const candles: Candle[] = [];

        // Look for data legend/window elements
        const dataLabels = document.querySelectorAll('[class*="valuesWrapper"], [class*="dataWindow"]');

        for (const labelContainer of dataLabels) {
            const text = labelContainer.textContent || '';

            // Parse OHLC pattern: O: 123.45 H: 124.00 L: 122.00 C: 123.80
            const oMatch = text.match(/O[:\s]+([0-9.]+)/i);
            const hMatch = text.match(/H[:\s]+([0-9.]+)/i);
            const lMatch = text.match(/L[:\s]+([0-9.]+)/i);
            const cMatch = text.match(/C[:\s]+([0-9.]+)/i);
            const vMatch = text.match(/V[ol]*[:\s]+([0-9.,KMB]+)/i);

            if (oMatch && hMatch && lMatch && cMatch) {
                candles.push({
                    timestamp: Date.now(),
                    open: parseFloat(oMatch[1]),
                    high: parseFloat(hMatch[1]),
                    low: parseFloat(lMatch[1]),
                    close: parseFloat(cMatch[1]),
                    volume: this.parseVolume(vMatch?.[1] || '0')
                });
            }
        }

        return candles;
    }

    private extractFromVisualElements(): Candle[] {
        // This is a placeholder - actual implementation would analyze
        // the canvas or SVG elements to extract candle positions and colors
        return [];
    }

    private interceptChartData(): Candle[] {
        const candles: Candle[] = [];

        // Try to access TradingView's internal data structures
        // This looks for global chart objects that may contain data
        try {
            const windowWithTV = window as unknown as {
                TradingView?: { activeChart?: () => { data?: () => unknown } };
                tvWidget?: { activeChart?: () => { data?: () => unknown } };
            };

            // These are exploratory - actual implementation needs adaptation
            // based on TradingView's current DOM structure
            const chartData = windowWithTV.TradingView?.activeChart?.()?.data?.();
            if (chartData && Array.isArray(chartData)) {
                // Transform to our Candle format
            }
        } catch {
            // Access may be restricted
        }

        return candles;
    }

    private parseVolume(volumeStr: string): number {
        const cleaned = volumeStr.replace(/,/g, '').toUpperCase();
        const multipliers: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };

        const match = cleaned.match(/([0-9.]+)([KMB])?/);
        if (match) {
            const value = parseFloat(match[1]);
            const multiplier = multipliers[match[2]] || 1;
            return value * multiplier;
        }

        return parseFloat(cleaned) || 0;
    }

    extractIndicators(): IndicatorData[] {
        const indicators: IndicatorData[] = [];

        // Extract RSI
        const rsi = this.extractIndicatorValue('RSI', 'momentum');
        if (rsi) indicators.push(rsi);

        // Extract MACD
        const macd = this.extractIndicatorValue('MACD', 'trend');
        if (macd) indicators.push(macd);

        // Extract Moving Averages
        const ema = this.extractIndicatorValue('EMA', 'trend');
        if (ema) indicators.push(ema);

        const sma = this.extractIndicatorValue('SMA', 'trend');
        if (sma) indicators.push(sma);

        return indicators;
    }

    private extractIndicatorValue(
        name: string,
        type: IndicatorData['type']
    ): IndicatorData | null {
        // Look for indicator panels and legend values
        const indicatorPanels = document.querySelectorAll(
            `[class*="pane-legend"], [class*="studyLegend"]`
        );

        for (const panel of indicatorPanels) {
            const text = panel.textContent || '';
            if (text.includes(name)) {
                // Extract numeric values
                const values = text.match(/[-0-9.]+/g)?.map(Number).filter(n => !isNaN(n)) || [];
                if (values.length > 0) {
                    return { name, type, values };
                }
            }
        }

        return null;
    }
}
