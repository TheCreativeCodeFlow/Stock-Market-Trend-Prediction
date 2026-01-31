# AI Trading Co-Pilot

🤖 An AI-powered browser extension that enhances TradingView with next-candlestick trend predictions and explainable insights.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Opera-green.svg)

## 🎯 Features

- **📊 Next-Candle Prediction** - Bullish / Bearish / Neutral with confidence scores
- **🧠 Hybrid ML** - Combines transformer (PatchTST) + gradient boosting (LightGBM)
- **💡 AI Explanations** - Gemini-powered reasoning for every prediction
- **📰 News Sentiment** - Real-time news integration for context
- **⚠️ Risk Alerts** - Detects potential false breakouts
- **🔒 No API Keys** - Screen-based analysis, works with any TradingView account

---

## 🚀 Installation Guide

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **Python** 3.10+ ([Download](https://python.org))
- **Chrome**, Edge, Brave, or Opera browser

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Stock-Market-Trend-Prediction.git
cd Stock-Market-Trend-Prediction
```

---

### Step 2: Build the Extension

```bash
cd extension
npm install
npm run build
```

This creates a `dist/` folder containing the built extension.

---

### Step 3: Load Extension in Browser

#### Chrome / Edge / Brave / Opera

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Edge**: `edge://extensions`
   - **Brave**: `brave://extensions`
   - **Opera**: `opera://extensions`

2. Enable **Developer Mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the folder: `Stock-Market-Trend-Prediction/extension/dist`

5. The extension icon 🤖 will appear in your toolbar

---

### Step 4: Start the Backend Server

Open a new terminal:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process
```

---

## 📖 How to Use

### 1. Open TradingView

Navigate to [https://www.tradingview.com](https://www.tradingview.com) and open any chart.

### 2. Extension Auto-Activates

The extension automatically:
- Detects the TradingView chart
- Extracts candle data from the screen
- Sends data to the backend for analysis
- Displays predictions as overlays on the chart

### 3. View Predictions

Look for the **trend arrow** on the chart:
- ↑ **Green Arrow** = Bullish prediction
- ↓ **Red Arrow** = Bearish prediction
- → **Gray Arrow** = Neutral prediction

Hover over the arrow to see:
- Confidence percentage
- Probability distribution
- AI-generated explanation

### 4. Access Settings

Click the extension icon 🤖 in your toolbar to:
- View the latest prediction
- Toggle auto-analysis on/off
- Enable/disable chart overlays
- Change analysis interval
- Configure backend API endpoint

---

## ⚙️ Configuration

### Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| API Endpoint | Backend server URL | `http://localhost:8000` |
| Auto-Analyze | Analyze charts automatically | ✅ Enabled |
| Show Overlays | Display predictions on chart | ✅ Enabled |
| Show Confidence | Show confidence percentages | ✅ Enabled |
| Show Explanations | Show AI explanations | ✅ Enabled |
| Analysis Interval | Time between analyses | 60 seconds |

### Backend API Keys (Optional)

Create a `.env` file in the `backend/` folder:

```env
# Gemini AI - for enhanced explanations
GEMINI_API_KEY=your_gemini_api_key

# News APIs - for sentiment analysis
NEWS_API_KEY=your_newsapi_key
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
```

> Without API keys, the extension still works using rule-based explanations.

---

## 🔧 Troubleshooting

### Extension Not Working on TradingView

1. Make sure the backend server is running (`http://localhost:8000/health`)
2. Check browser console for errors (F12 → Console)
3. Verify the extension is enabled in `chrome://extensions`
4. Try refreshing the TradingView page

### Backend Connection Failed

1. Ensure port 8000 is not blocked by firewall
2. Check if another application is using port 8000
3. Try: `uvicorn main:app --port 8001` and update extension settings

### No Predictions Showing

1. Wait for the chart to fully load
2. Ensure at least 5 candles are visible
3. Click the extension icon and check status

---

## 🏗️ Project Structure

```
Stock-Market-Trend-Prediction/
├── extension/              # Browser extension
│   ├── dist/               # Built extension (load this!)
│   ├── src/
│   │   ├── content/        # TradingView integration
│   │   ├── background/     # Service worker
│   │   └── popup/          # Settings UI
│   └── package.json
│
├── backend/                # Python ML server
│   ├── main.py             # FastAPI entry point
│   ├── models/             # ML models
│   ├── indicators/         # Technical analysis
│   ├── ai/                 # Gemini integration
│   └── requirements.txt
│
└── README.md
```

---

## ⚠️ Disclaimer

> **Not Financial Advice**  
> This tool is for educational and research purposes only. Predictions are based on historical patterns and may not reflect future market behavior. Never make trading decisions based solely on these predictions. Always do your own research.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.
