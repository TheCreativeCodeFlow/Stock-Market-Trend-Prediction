# FastAPI Main Application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import prediction, analysis, news

load_dotenv()

app = FastAPI(
    title="AI Trading Co-Pilot API",
    description="ML-powered next-candle trend prediction service",
    version="1.0.0"
)

# CORS configuration for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-trading-copilot",
        "version": "1.0.0"
    }

# Include API routes
app.include_router(prediction.router, prefix="/api", tags=["prediction"])
app.include_router(analysis.router, prefix="/api", tags=["analysis"])
app.include_router(news.router, prefix="/api", tags=["news"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
