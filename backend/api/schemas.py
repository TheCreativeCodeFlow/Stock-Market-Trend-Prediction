# Pydantic schemas for API requests and responses
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from datetime import datetime


class Candle(BaseModel):
    """OHLCV candlestick data"""
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price")
    low: float = Field(..., description="Lowest price")
    close: float = Field(..., description="Closing price")
    volume: float = Field(default=0, description="Trading volume")


class IndicatorData(BaseModel):
    """Technical indicator data"""
    name: str = Field(..., description="Indicator name (RSI, MACD, etc.)")
    type: Literal["momentum", "trend", "volume", "volatility"]
    values: List[float] = Field(default_factory=list)


class ChartDataRequest(BaseModel):
    """Request payload for chart analysis"""
    symbol: str = Field(..., description="Trading symbol (e.g., AAPL, BTCUSD)")
    timeframe: str = Field(default="1D", description="Chart timeframe")
    candles: List[Candle] = Field(..., description="Historical candle data")
    indicators: List[IndicatorData] = Field(default_factory=list)


class Prediction(BaseModel):
    """ML model prediction output"""
    direction: Literal["bullish", "bearish", "neutral"]
    confidence: float = Field(..., ge=0, le=100)
    probabilities: Dict[str, float] = Field(
        ..., 
        description="Probability distribution for each direction"
    )
    timestamp: int


class TechnicalAnalysis(BaseModel):
    """Computed technical indicators"""
    rsi: Optional[float] = None
    macd: Optional[Dict[str, float]] = None
    ema: Optional[Dict[int, float]] = None
    sma: Optional[Dict[int, float]] = None
    volume_analysis: Optional[Dict[str, any]] = None


class NewsSentiment(BaseModel):
    """News sentiment analysis result"""
    sentiment: Literal["positive", "negative", "neutral"]
    impact: Literal["high", "medium", "low"]
    headlines: List[str] = Field(default_factory=list)
    score: float = Field(..., ge=-1, le=1)


class InsightResponse(BaseModel):
    """Complete analysis response"""
    prediction: Prediction
    technical_analysis: TechnicalAnalysis
    sentiment: Optional[NewsSentiment] = None
    explanation: str = Field(..., description="AI-generated explanation")
    risk_level: Literal["low", "medium", "high"]
    warnings: List[str] = Field(default_factory=list)
    generated_at: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))


class NewsResponse(BaseModel):
    """News API response"""
    symbol: str
    headlines: List[str]
    sentiment_score: float
    fetched_at: int
