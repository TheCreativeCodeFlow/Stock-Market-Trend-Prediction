# PatchTST Transformer Predictor
from typing import List, Dict, Any
import numpy as np


class PatchTSTPredictor:
    """
    PatchTST-based time series predictor for trend direction.
    
    PatchTST (Patch Time Series Transformer) excels at:
    - Capturing long-range dependencies
    - Multi-scale pattern recognition
    - Handling irregular time series
    
    Note: This is a simplified implementation. For production,
    integrate the actual PatchTST model from Hugging Face.
    """
    
    def __init__(self, model_path: str = None):
        self.model_loaded = False
        self.sequence_length = 60  # Number of candles to analyze
        
        # In production, load PatchTST model here:
        # from transformers import PatchTSTForPrediction
        # self.model = PatchTSTForPrediction.from_pretrained(model_path)
    
    def predict(
        self, 
        candles: List[Dict[str, Any]], 
        indicators: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Predict next candle direction using transformer analysis.
        
        Args:
            candles: Historical OHLCV data
            indicators: Technical indicators
            
        Returns:
            Prediction with direction, confidence, and probabilities
        """
        # Feature extraction
        features = self._extract_features(candles, indicators)
        
        # Simplified prediction logic (replace with actual model inference)
        # This analyzes trend, momentum, and patterns
        prediction = self._analyze_patterns(features, candles, indicators)
        
        return prediction
    
    def _extract_features(
        self, 
        candles: List[Dict[str, Any]], 
        indicators: Dict[str, Any]
    ) -> np.ndarray:
        """Extract features for model input."""
        features = []
        
        for candle in candles[-self.sequence_length:]:
            candle_features = [
                candle.get("open", 0),
                candle.get("high", 0),
                candle.get("low", 0),
                candle.get("close", 0),
                candle.get("volume", 0)
            ]
            features.append(candle_features)
        
        return np.array(features) if features else np.array([])
    
    def _analyze_patterns(
        self, 
        features: np.ndarray, 
        candles: List[Dict[str, Any]],
        indicators: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze patterns to predict direction.
        
        This simplified version uses:
        - Recent price momentum
        - Candle patterns
        - Technical indicator signals
        """
        if len(candles) < 5:
            return self._neutral_prediction()
        
        # Calculate recent momentum
        recent_closes = [c.get("close", 0) for c in candles[-10:]]
        if len(recent_closes) >= 2 and recent_closes[0] != 0:
            momentum = (recent_closes[-1] - recent_closes[0]) / recent_closes[0]
        else:
            momentum = 0
        
        # Analyze last few candles
        last_candles = candles[-5:]
        bullish_count = sum(1 for c in last_candles if c.get("close", 0) > c.get("open", 0))
        bearish_count = len(last_candles) - bullish_count
        
        # Check indicators
        rsi = indicators.get("rsi", 50)
        macd = indicators.get("macd", {})
        macd_histogram = macd.get("histogram", 0) if macd else 0
        
        # Score calculation
        bullish_score = 0
        bearish_score = 0
        
        # Momentum contribution
        if momentum > 0.01:
            bullish_score += 25
        elif momentum < -0.01:
            bearish_score += 25
        
        # Candle pattern contribution
        bullish_score += bullish_count * 8
        bearish_score += bearish_count * 8
        
        # RSI contribution
        if rsi and rsi < 30:
            bullish_score += 15  # Oversold - potential reversal up
        elif rsi and rsi > 70:
            bearish_score += 15  # Overbought - potential reversal down
        elif rsi:
            if rsi > 50:
                bullish_score += 5
            else:
                bearish_score += 5
        
        # MACD contribution
        if macd_histogram > 0:
            bullish_score += 10
        elif macd_histogram < 0:
            bearish_score += 10
        
        # Normalize to probabilities
        total_score = bullish_score + bearish_score + 20  # 20 for neutral baseline
        
        bullish_prob = bullish_score / total_score
        bearish_prob = bearish_score / total_score
        neutral_prob = 1 - bullish_prob - bearish_prob
        
        # Determine direction
        if bullish_prob > bearish_prob and bullish_prob > 0.4:
            direction = "bullish"
            confidence = bullish_prob * 100
        elif bearish_prob > bullish_prob and bearish_prob > 0.4:
            direction = "bearish"
            confidence = bearish_prob * 100
        else:
            direction = "neutral"
            confidence = neutral_prob * 100
        
        return {
            "direction": direction,
            "confidence": min(confidence, 90),
            "probabilities": {
                "bullish": bullish_prob,
                "bearish": bearish_prob,
                "neutral": max(neutral_prob, 0.1)
            }
        }
    
    def _neutral_prediction(self) -> Dict[str, Any]:
        """Return a neutral prediction when data is insufficient."""
        return {
            "direction": "neutral",
            "confidence": 33,
            "probabilities": {
                "bullish": 0.33,
                "bearish": 0.33,
                "neutral": 0.34
            }
        }
