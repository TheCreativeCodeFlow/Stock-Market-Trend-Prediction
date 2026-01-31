# AI Trading Co-Pilot Backend

FastAPI-based ML backend for next-candle trend prediction.

## Requirements

- Python 3.10+
- CUDA (optional, for GPU acceleration)

## Installation

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Running

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze` - Analyze chart data and return prediction
- `GET /api/news/{symbol}` - Get news sentiment for symbol
