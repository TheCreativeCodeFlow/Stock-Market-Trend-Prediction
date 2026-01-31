// Screen Analyzer for visual chart analysis
import { Candle, ChartData, IndicatorData } from '../shared/types';

interface CandleVisual {
    x: number;
    top: number;
    bottom: number;
    bodyTop: number;
    bodyBottom: number;
    isBullish: boolean;
    width: number;
}

export class ScreenAnalyzer {
    private chartContainer: HTMLElement | null = null;

    async analyzeChart(): Promise<ChartData> {
        this.chartContainer = this.findChartContainer();

        if (!this.chartContainer) {
            console.warn('[ScreenAnalyzer] Chart container not found');
            return this.emptyChartData();
        }

        return {
            symbol: this.inferSymbol(),
            timeframe: this.inferTimeframe(),
            candles: await this.analyzeCandles(),
            indicators: await this.analyzeIndicators()
        };
    }

    private findChartContainer(): HTMLElement | null {
        const selectors = [
            '.chart-container canvas',
            '[class*="chart-markup-table"] canvas',
            '.tv-chart-container canvas',
            'canvas[class*="chart"]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.closest('.chart-container') as HTMLElement
                    || element.parentElement as HTMLElement;
            }
        }

        return null;
    }

    private inferSymbol(): string {
        // Symbol extraction is primarily handled by DOM parser
        // This is a fallback using visual clues
        const symbolElements = document.querySelectorAll('[class*="symbol"], [class*="ticker"]');
        for (const el of symbolElements) {
            const text = el.textContent?.trim();
            if (text && /^[A-Z0-9]{1,10}$/i.test(text)) {
                return text.toUpperCase();
            }
        }
        return '';
    }

    private inferTimeframe(): string {
        return '';
    }

    private async analyzeCandles(): Promise<Candle[]> {
        const candles: Candle[] = [];

        if (!this.chartContainer) return candles;

        // Get the main chart canvas
        const canvas = this.chartContainer.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return candles;

        // Analyze canvas for candle patterns
        const visualCandles = this.detectCandlesFromCanvas(canvas);

        // Convert visual data to OHLC estimates
        const priceScale = this.detectPriceScale();

        if (priceScale && visualCandles.length > 0) {
            for (const vc of visualCandles) {
                candles.push(this.visualToCandle(vc, priceScale, canvas.height));
            }
        }

        return candles;
    }

    private detectCandlesFromCanvas(canvas: HTMLCanvasElement): CandleVisual[] {
        const candles: CandleVisual[] = [];

        try {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return candles;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Analyze vertical stripes for candle patterns
            // This is a simplified approach - real implementation would be more sophisticated
            const stripeWidth = Math.max(3, Math.floor(canvas.width / 100));

            for (let x = 0; x < canvas.width; x += stripeWidth) {
                const stripe = this.analyzeVerticalStripe(data, x, canvas.width, canvas.height);
                if (stripe) {
                    candles.push({ ...stripe, x, width: stripeWidth });
                }
            }
        } catch (error) {
            console.warn('[ScreenAnalyzer] Canvas analysis failed:', error);
        }

        return candles;
    }

    private analyzeVerticalStripe(
        data: Uint8ClampedArray,
        x: number,
        width: number,
        height: number
    ): Omit<CandleVisual, 'x' | 'width'> | null {
        let topPixel = -1;
        let bottomPixel = -1;
        let greenCount = 0;
        let redCount = 0;

        for (let y = 0; y < height; y++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Skip transparent or background pixels
            if (a < 128) continue;

            // Detect candle colors (green = bullish, red = bearish)
            const isGreen = g > r && g > b && g > 100;
            const isRed = r > g && r > b && r > 100;

            if (isGreen || isRed) {
                if (topPixel === -1) topPixel = y;
                bottomPixel = y;

                if (isGreen) greenCount++;
                if (isRed) redCount++;
            }
        }

        if (topPixel === -1 || bottomPixel === topPixel) {
            return null;
        }

        const isBullish = greenCount > redCount;

        return {
            top: topPixel,
            bottom: bottomPixel,
            bodyTop: topPixel + Math.floor((bottomPixel - topPixel) * 0.1),
            bodyBottom: bottomPixel - Math.floor((bottomPixel - topPixel) * 0.1),
            isBullish
        };
    }

    private detectPriceScale(): { min: number; max: number } | null {
        // Look for price axis labels
        const priceLabels = document.querySelectorAll(
            '[class*="price-axis"] [class*="label"], [class*="priceAxis"] span'
        );

        const prices: number[] = [];

        priceLabels.forEach(label => {
            const text = label.textContent?.trim();
            if (text) {
                const price = parseFloat(text.replace(/[^0-9.]/g, ''));
                if (!isNaN(price) && price > 0) {
                    prices.push(price);
                }
            }
        });

        if (prices.length >= 2) {
            return {
                min: Math.min(...prices),
                max: Math.max(...prices)
            };
        }

        return null;
    }

    private visualToCandle(
        vc: CandleVisual,
        priceScale: { min: number; max: number },
        canvasHeight: number
    ): Candle {
        const priceRange = priceScale.max - priceScale.min;

        const pixelToPrice = (pixel: number): number => {
            const ratio = 1 - (pixel / canvasHeight);
            return priceScale.min + (ratio * priceRange);
        };

        const high = pixelToPrice(vc.top);
        const low = pixelToPrice(vc.bottom);

        // For bullish candles: open < close
        // For bearish candles: open > close
        const bodyHigh = pixelToPrice(vc.bodyTop);
        const bodyLow = pixelToPrice(vc.bodyBottom);

        return {
            timestamp: Date.now() - (vc.x * 60000), // Approximate
            open: vc.isBullish ? bodyLow : bodyHigh,
            high,
            low,
            close: vc.isBullish ? bodyHigh : bodyLow,
            volume: 0 // Volume not available from visual analysis
        };
    }

    private async analyzeIndicators(): Promise<IndicatorData[]> {
        // Visual indicator analysis would look for specific patterns
        // in separate chart panes (RSI, MACD, etc.)
        return [];
    }

    private emptyChartData(): ChartData {
        return {
            symbol: '',
            timeframe: '',
            candles: [],
            indicators: []
        };
    }
}
