# Prediction API Route
from fastapi import APIRouter, HTTPException
from api.schemas import ChartDataRequest, InsightResponse, Prediction, TechnicalAnalysis
from models.hybrid_decision import HybridPredictor
from indicators.calculator import IndicatorCalculator
from ai.explanation_generator import ExplanationGenerator
import time

router = APIRouter()

# Initialize services
predictor = HybridPredictor()
indicator_calc = IndicatorCalculator()
explanation_gen = ExplanationGenerator()


@router.post("/predict", response_model=InsightResponse)
async def predict_next_candle(request: ChartDataRequest):
    """
    Predict the next candle's trend direction based on chart data.
    
    Uses a hybrid ML approach combining PatchTST transformer and LightGBM.
    """
    try:
        if len(request.candles) < 5:
            raise HTTPException(
                status_code=400, 
                detail="At least 5 candles required for prediction"
            )
        
        # Convert candles to list of dicts for processing
        candles_data = [c.model_dump() for c in request.candles]
        
        # Calculate technical indicators
        tech_analysis = indicator_calc.calculate_all(candles_data)
        
        # Get ML prediction
        prediction_result = predictor.predict(
            candles=candles_data,
            indicators=tech_analysis,
            existing_indicators=[i.model_dump() for i in request.indicators]
        )
        
        # Generate AI explanation
        explanation = await explanation_gen.generate(
            symbol=request.symbol,
            prediction=prediction_result,
            technical=tech_analysis,
            api_key=request.gemini_api_key
        )
        
        # Assess risk level
        risk_level = assess_risk(prediction_result, tech_analysis)
        
        # Generate warnings
        warnings = generate_warnings(prediction_result, tech_analysis)
        
        return InsightResponse(
            prediction=Prediction(
                direction=prediction_result["direction"],
                confidence=prediction_result["confidence"],
                probabilities=prediction_result["probabilities"],
                timestamp=int(time.time() * 1000)
            ),
            technical_analysis=TechnicalAnalysis(
                rsi=tech_analysis.get("rsi"),
                macd=tech_analysis.get("macd"),
                ema=tech_analysis.get("ema"),
                sma=tech_analysis.get("sma"),
                volume_analysis=tech_analysis.get("volume")
            ),
            explanation=explanation,
            risk_level=risk_level,
            warnings=warnings
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def assess_risk(prediction: dict, technical: dict) -> str:
    """Assess risk level based on prediction confidence and technical signals."""
    confidence = prediction.get("confidence", 50)
    
    # Check for conflicting signals
    conflicts = prediction.get("model_agreement", True)
    
    if confidence >= 70 and conflicts:
        return "low"
    elif confidence >= 50:
        return "medium"
    else:
        return "high"


def generate_warnings(prediction: dict, technical: dict) -> list:
    """Generate risk warnings based on analysis."""
    warnings = []
    
    # Low confidence warning
    if prediction.get("confidence", 50) < 50:
        warnings.append("Low confidence prediction - consider waiting for clearer signals.")
    
    # Model disagreement
    if not prediction.get("model_agreement", True):
        warnings.append("ML models show conflicting signals - increased uncertainty.")
    
    # RSI extremes
    rsi = technical.get("rsi")
    if rsi and (rsi > 70 or rsi < 30):
        condition = "overbought" if rsi > 70 else "oversold"
        warnings.append(f"RSI indicates {condition} conditions - reversal possible.")
    
    # Volume concerns
    vol = technical.get("volume", {})
    if vol.get("trend") == "decreasing" and prediction.get("direction") != "neutral":
        warnings.append("Low volume may not support directional move.")
    
    return warnings
