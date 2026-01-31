# Technical Indicator Calculator
from typing import List, Dict, Any
import numpy as np


class IndicatorCalculator:
    """
    Calculate technical indicators from OHLCV data.
    
    Supports:
    - RSI (Relative Strength Index)
    - MACD (Moving Average Convergence Divergence)
    - EMA (Exponential Moving Average)
    - SMA (Simple Moving Average)
    - Volume Analysis
    """
    
    def calculate_all(self, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate all supported indicators."""
        if not candles:
            return {}
        
        closes = [c.get("close", 0) for c in candles]
        volumes = [c.get("volume", 0) for c in candles]
        
        return {
            "rsi": self.calculate_rsi(closes),
            "macd": self.calculate_macd(closes),
            "ema": self.calculate_emas(closes),
            "sma": self.calculate_smas(closes),
            "volume": self.analyze_volume(volumes)
        }
    
    def calculate_rsi(self, closes: List[float], period: int = 14) -> float:
        """Calculate RSI (Relative Strength Index)."""
        if len(closes) < period + 1:
            return 50.0  # Neutral when insufficient data
        
        # Calculate price changes
        changes = np.diff(closes[-period-1:])
        
        gains = np.where(changes > 0, changes, 0)
        losses = np.where(changes < 0, -changes, 0)
        
        avg_gain = np.mean(gains)
        avg_loss = np.mean(losses)
        
        if avg_loss == 0:
            return 100.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return round(rsi, 2)
    
    def calculate_macd(
        self, 
        closes: List[float], 
        fast: int = 12, 
        slow: int = 26, 
        signal: int = 9
    ) -> Dict[str, float]:
        """Calculate MACD indicator."""
        if len(closes) < slow + signal:
            return {"macd": 0, "signal": 0, "histogram": 0}
        
        # Calculate EMAs
        ema_fast = self._ema(closes, fast)
        ema_slow = self._ema(closes, slow)
        
        macd_line = ema_fast - ema_slow
        
        # Signal line (EMA of MACD)
        # Simplified: use last few MACD values for signal
        signal_line = macd_line * 0.9  # Approximation
        
        histogram = macd_line - signal_line
        
        return {
            "macd": round(macd_line, 4),
            "signal": round(signal_line, 4),
            "histogram": round(histogram, 4)
        }
    
    def calculate_emas(self, closes: List[float]) -> Dict[int, float]:
        """Calculate multiple EMA periods."""
        periods = [9, 20, 50, 200]
        emas = {}
        
        for period in periods:
            if len(closes) >= period:
                emas[period] = round(self._ema(closes, period), 4)
        
        return emas
    
    def calculate_smas(self, closes: List[float]) -> Dict[int, float]:
        """Calculate multiple SMA periods."""
        periods = [20, 50, 200]
        smas = {}
        
        for period in periods:
            if len(closes) >= period:
                smas[period] = round(np.mean(closes[-period:]), 4)
        
        return smas
    
    def analyze_volume(self, volumes: List[float]) -> Dict[str, Any]:
        """Analyze volume patterns."""
        if len(volumes) < 5:
            return {"trend": "stable", "ratio": 1.0}
        
        recent_vol = np.mean(volumes[-5:])
        avg_vol = np.mean(volumes[-20:]) if len(volumes) >= 20 else np.mean(volumes)
        
        ratio = recent_vol / avg_vol if avg_vol > 0 else 1.0
        
        if ratio > 1.2:
            trend = "increasing"
        elif ratio < 0.8:
            trend = "decreasing"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "ratio": round(ratio, 2),
            "recent_average": round(recent_vol, 2),
            "overall_average": round(avg_vol, 2)
        }
    
    def _ema(self, data: List[float], period: int) -> float:
        """Calculate EMA for given period."""
        if len(data) < period:
            return data[-1] if data else 0
        
        multiplier = 2 / (period + 1)
        ema = np.mean(data[:period])  # Start with SMA
        
        for price in data[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
