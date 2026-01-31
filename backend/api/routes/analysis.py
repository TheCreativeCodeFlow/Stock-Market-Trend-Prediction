# Analysis API Route
from fastapi import APIRouter, HTTPException
from api.schemas import ChartDataRequest, InsightResponse
from api.routes.prediction import predict_next_candle

router = APIRouter()


@router.post("/analyze", response_model=InsightResponse)
async def analyze_chart(request: ChartDataRequest):
    """
    Full chart analysis endpoint - combines prediction with news sentiment.
    
    This is the main endpoint called by the browser extension.
    """
    # Delegate to prediction endpoint (which includes full analysis)
    return await predict_next_candle(request)
