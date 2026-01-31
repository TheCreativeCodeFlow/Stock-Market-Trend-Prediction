# News Fetcher for Sentiment Analysis
import os
from typing import Dict, Any, List
import aiohttp


class NewsFetcher:
    """
    Fetch financial news for sentiment analysis.
    
    Supports multiple news APIs with fallback.
    """
    
    def __init__(self):
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.alpha_vantage_key = os.getenv("ALPHA_VANTAGE_KEY")
    
    async def fetch(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch news for a symbol and analyze sentiment.
        
        Args:
            symbol: Trading symbol (e.g., AAPL, BTCUSD)
            
        Returns:
            Dictionary with headlines and sentiment score
        """
        headlines = []
        
        # Try to fetch from available APIs
        if self.news_api_key:
            headlines = await self._fetch_from_newsapi(symbol)
        elif self.alpha_vantage_key:
            headlines = await self._fetch_from_alpha_vantage(symbol)
        else:
            # Generate placeholder for demo purposes
            headlines = self._generate_placeholder_headlines(symbol)
        
        # Calculate sentiment score
        sentiment_score = self._calculate_sentiment(headlines)
        
        return {
            "headlines": headlines[:5],  # Return top 5
            "sentiment_score": sentiment_score
        }
    
    async def _fetch_from_newsapi(self, symbol: str) -> List[str]:
        """Fetch from NewsAPI."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://newsapi.org/v2/everything"
                params = {
                    "q": symbol,
                    "sortBy": "publishedAt",
                    "pageSize": 10,
                    "apiKey": self.news_api_key
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [
                            article.get("title", "")
                            for article in data.get("articles", [])
                        ]
        except Exception:
            pass
        
        return []
    
    async def _fetch_from_alpha_vantage(self, symbol: str) -> List[str]:
        """Fetch from Alpha Vantage News API."""
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://www.alphavantage.co/query"
                params = {
                    "function": "NEWS_SENTIMENT",
                    "tickers": symbol,
                    "apikey": self.alpha_vantage_key
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [
                            item.get("title", "")
                            for item in data.get("feed", [])[:10]
                        ]
        except Exception:
            pass
        
        return []
    
    def _generate_placeholder_headlines(self, symbol: str) -> List[str]:
        """Generate placeholder headlines for demo."""
        return [
            f"{symbol} shows mixed trading signals amid market uncertainty",
            f"Analysts maintain neutral outlook on {symbol}",
            f"Volume patterns suggest consolidation phase for {symbol}"
        ]
    
    def _calculate_sentiment(self, headlines: List[str]) -> float:
        """
        Calculate aggregate sentiment score from headlines.
        
        Returns:
            Score from -1 (very negative) to 1 (very positive)
        """
        if not headlines:
            return 0.0
        
        positive_words = [
            "surge", "rally", "gain", "rise", "bullish", "upgrade",
            "beat", "strong", "growth", "profit", "success", "high"
        ]
        negative_words = [
            "drop", "fall", "decline", "bearish", "downgrade", "miss",
            "weak", "loss", "fail", "low", "crash", "sell"
        ]
        
        positive_count = 0
        negative_count = 0
        
        for headline in headlines:
            lower_headline = headline.lower()
            positive_count += sum(1 for w in positive_words if w in lower_headline)
            negative_count += sum(1 for w in negative_words if w in lower_headline)
        
        total = positive_count + negative_count
        
        if total == 0:
            return 0.0
        
        return round((positive_count - negative_count) / total, 2)
