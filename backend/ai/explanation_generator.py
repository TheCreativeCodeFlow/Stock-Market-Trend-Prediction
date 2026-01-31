# AI Explanation Generator using Gemini
import os
from typing import Dict, Any, Optional


class ExplanationGenerator:
    """
    Generate human-readable explanations for predictions using Gemini AI.
    
    This class provides contextual explanations based on:
    - Prediction direction and confidence
    - Technical indicator signals
    - Market context
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-pro"
        
        # In production, initialize Gemini client:
        # import google.generativeai as genai
        # genai.configure(api_key=self.api_key)
        # self.model = genai.GenerativeModel(self.model_name)
    
    async def generate(
        self,
        symbol: str,
        prediction: Dict[str, Any],
        technical: Dict[str, Any],
        sentiment: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate explanation for the prediction.
        
        Args:
            symbol: Trading symbol
            prediction: ML prediction result
            technical: Technical indicators
            sentiment: Optional news sentiment
            
        Returns:
            Human-readable explanation string
        """
        # If API key available, use Gemini
        if self.api_key:
            return await self._generate_with_gemini(
                symbol, prediction, technical, sentiment
            )
        
        # Fallback to rule-based explanation
        return self._generate_rule_based(symbol, prediction, technical, sentiment)
    
    async def _generate_with_gemini(
        self,
        symbol: str,
        prediction: Dict[str, Any],
        technical: Dict[str, Any],
        sentiment: Optional[Dict[str, Any]]
    ) -> str:
        """Generate explanation using Gemini API."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)
            
            prompt = self._build_prompt(symbol, prediction, technical, sentiment)
            response = await model.generate_content_async(prompt)
            
            return response.text
        except Exception as e:
            # Fallback on error
            return self._generate_rule_based(symbol, prediction, technical, sentiment)
    
    def _build_prompt(
        self,
        symbol: str,
        prediction: Dict[str, Any],
        technical: Dict[str, Any],
        sentiment: Optional[Dict[str, Any]]
    ) -> str:
        """Build prompt for Gemini."""
        return f"""You are a technical analysis expert. Explain why the next candlestick 
for {symbol} is predicted to be {prediction['direction']} with {prediction['confidence']}% confidence.

Technical Indicators:
- RSI: {technical.get('rsi', 'N/A')}
- MACD: {technical.get('macd', 'N/A')}
- EMA: {technical.get('ema', 'N/A')}
- Volume: {technical.get('volume', 'N/A')}

{f"News Sentiment: {sentiment}" if sentiment else ""}

Provide a concise 2-3 sentence explanation suitable for a trader.
Do not give financial advice. Focus on technical reasoning."""

    def _generate_rule_based(
        self,
        symbol: str,
        prediction: Dict[str, Any],
        technical: Dict[str, Any],
        sentiment: Optional[Dict[str, Any]]
    ) -> str:
        """Generate rule-based explanation without API."""
        direction = prediction.get("direction", "neutral")
        confidence = prediction.get("confidence", 50)
        
        explanations = []
        
        # RSI analysis
        rsi = technical.get("rsi")
        if rsi:
            if rsi < 30:
                explanations.append(f"RSI at {rsi:.1f} indicates oversold conditions, suggesting potential upward momentum")
            elif rsi > 70:
                explanations.append(f"RSI at {rsi:.1f} shows overbought conditions, signaling possible reversal pressure")
            elif rsi > 50:
                explanations.append(f"RSI at {rsi:.1f} shows bullish momentum")
            else:
                explanations.append(f"RSI at {rsi:.1f} indicates bearish pressure")
        
        # MACD analysis
        macd = technical.get("macd", {})
        if macd:
            histogram = macd.get("histogram", 0)
            if histogram > 0:
                explanations.append("MACD histogram is positive, supporting bullish bias")
            elif histogram < 0:
                explanations.append("MACD histogram is negative, indicating bearish momentum")
        
        # Volume analysis
        volume = technical.get("volume", {})
        if volume:
            vol_trend = volume.get("trend", "stable")
            if vol_trend == "increasing":
                explanations.append("Increasing volume supports the current trend")
            elif vol_trend == "decreasing":
                explanations.append("Declining volume suggests weakening conviction")
        
        # EMA trend
        ema = technical.get("ema", {})
        if ema and 20 in ema and 50 in ema:
            if ema[20] > ema[50]:
                explanations.append("Short-term EMA above long-term EMA indicates uptrend")
            else:
                explanations.append("Short-term EMA below long-term EMA suggests downtrend")
        
        # Build final explanation
        if explanations:
            base = ". ".join(explanations[:2])  # Take first 2
        else:
            base = f"Based on recent price action and momentum analysis"
        
        confidence_text = "high" if confidence > 70 else "moderate" if confidence > 50 else "low"
        
        return f"{base}. The {direction} prediction has {confidence_text} confidence at {confidence:.0f}%."
