# News API Route
from fastapi import APIRouter, HTTPException
from api.schemas import NewsResponse
from ai.news_fetcher import NewsFetcher
import time

router = APIRouter()

news_fetcher = NewsFetcher()


@router.get("/news/{symbol}", response_model=NewsResponse)
async def get_news_sentiment(symbol: str):
    """
    Fetch and analyze news sentiment for a given symbol.
    """
    try:
        news_data = await news_fetcher.fetch(symbol)
        
        return NewsResponse(
            symbol=symbol.upper(),
            headlines=news_data.get("headlines", []),
            sentiment_score=news_data.get("sentiment_score", 0.0),
            fetched_at=int(time.time() * 1000)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
