# Hybrid Decision Engine - Combines PatchTST and LightGBM
from typing import List, Dict, Any
from models.patchtst_predictor import PatchTSTPredictor
from models.lightgbm_classifier import LightGBMClassifier


class HybridPredictor:
    """
    Hybrid ML predictor combining transformer and gradient boosting models.
    
    Strategy:
    - PatchTST: Primary signal for complex temporal patterns
    - LightGBM: Fast confirmation and fallback
    - Disagreement handling: Returns neutral with warning
    """
    
    def __init__(self):
        self.transformer = PatchTSTPredictor()
        self.lgbm = LightGBMClassifier()
        self.transformer_weight = 0.6
        self.lgbm_weight = 0.4
    
    def predict(
        self, 
        candles: List[Dict[str, Any]], 
        indicators: Dict[str, Any],
        existing_indicators: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate hybrid prediction from both models.
        
        Args:
            candles: List of OHLCV candle dictionaries
            indicators: Calculated technical indicators
            existing_indicators: Pre-existing indicators from chart
            
        Returns:
            Prediction dictionary with direction, confidence, and probabilities
        """
        # Get predictions from both models
        transformer_pred = self.transformer.predict(candles, indicators)
        lgbm_pred = self.lgbm.predict(candles, indicators)
        
        # Check for model agreement
        model_agreement = transformer_pred["direction"] == lgbm_pred["direction"]
        
        if model_agreement:
            # Models agree - weighted average of probabilities
            combined_probs = self._weighted_average(
                transformer_pred["probabilities"],
                lgbm_pred["probabilities"]
            )
            direction = transformer_pred["direction"]
            confidence = max(
                transformer_pred["confidence"] * self.transformer_weight +
                lgbm_pred["confidence"] * self.lgbm_weight,
                combined_probs[direction] * 100
            )
        else:
            # Models disagree - use neutral or lower confidence
            transformer_conf = transformer_pred["confidence"]
            lgbm_conf = lgbm_pred["confidence"]
            
            # Use higher confidence model if confident enough
            if transformer_conf > 70 and transformer_conf > lgbm_conf + 20:
                direction = transformer_pred["direction"]
                combined_probs = transformer_pred["probabilities"]
                confidence = transformer_conf * 0.7  # Reduce confidence
            elif lgbm_conf > 70 and lgbm_conf > transformer_conf + 20:
                direction = lgbm_pred["direction"]
                combined_probs = lgbm_pred["probabilities"]
                confidence = lgbm_conf * 0.7
            else:
                # Too uncertain - go neutral
                direction = "neutral"
                combined_probs = {"bullish": 0.33, "bearish": 0.33, "neutral": 0.34}
                confidence = 40
        
        return {
            "direction": direction,
            "confidence": round(min(confidence, 95), 1),  # Cap at 95%
            "probabilities": {
                k: round(v * 100, 1) for k, v in combined_probs.items()
            },
            "model_agreement": model_agreement,
            "transformer_signal": transformer_pred["direction"],
            "lgbm_signal": lgbm_pred["direction"]
        }
    
    def _weighted_average(
        self, 
        probs1: Dict[str, float], 
        probs2: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate weighted average of probability distributions."""
        result = {}
        for key in ["bullish", "bearish", "neutral"]:
            result[key] = (
                probs1.get(key, 0.33) * self.transformer_weight +
                probs2.get(key, 0.33) * self.lgbm_weight
            )
        
        # Normalize to sum to 1
        total = sum(result.values())
        return {k: v / total for k, v in result.items()}
