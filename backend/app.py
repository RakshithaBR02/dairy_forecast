from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import requests

from model import HybridModel
from utils import calculate_metrics

# Initialize app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load dataset
df = pd.read_csv("storage/dataset.csv")

# Train model
model = HybridModel()
model.train(df)


# 🌦️ WEATHER API
def get_temperature(city):
    API_KEY = "9aed3771e7893e17cbff1a268d60ffd6"

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    try:
        res = requests.get(url).json()
        return res["main"]["temp"]
    except:
        return None


# 🧠 SMART EXPLANATION
def explain(df, preds, region, temp):

    recent = df.tail(7)

    avg_demand = recent["Demand"].mean()
    last_demand = df.iloc[-1]["Demand"]

    trend = preds[-1] - preds[0]

    text = ""

    if trend > 5:
        text += f"Demand is increasing in {region}. "
    elif trend < -5:
        text += f"Demand is decreasing in {region}. "
    else:
        text += f"Demand remains stable in {region}. "

    if last_demand > avg_demand:
        text += "Recent demand is above average, indicating strong consumption. "
    else:
        text += "Recent demand is slightly lower than average. "

    if temp:
        if temp > 35:
            text += f"High temperature (~{round(temp)}°C) is boosting dairy consumption. "
        else:
            text += f"Moderate temperature (~{round(temp)}°C) supports stable demand. "

    text += "Seasonal and historical patterns captured by the hybrid model influence this forecast."

    return text


# 📊 CONFIDENCE
def confidence(preds):
    std = np.std(preds)

    if std < 5:
        return "High"
    elif std < 15:
        return "Medium"
    else:
        return "Low"


# 💰 BUSINESS INSIGHT
def business_impact(metrics, region):
    total = metrics["total"]

    if total > 3000:
        return f"High demand expected in {region}. Increase production and ensure supply chain readiness."
    elif total > 1500:
        return f"Moderate demand in {region}. Maintain steady production levels."
    else:
        return f"Lower demand in {region}. Reduce production to avoid wastage."


# 🔮 API
@app.get("/predict")
def predict(product: str, days: int, region: str):

    # 🔥 FILTER
    data = df[(df["Product"] == product) & (df["Region"] == region)]

    preds = model.predict(data, days)

    sarimax = [float(x) for x in preds["sarimax"]]
    xgboost = [float(x) for x in preds["xgboost"]]
    hybrid = [float(x) for x in preds["hybrid"]]

    metrics = calculate_metrics(hybrid)

    # 🌦️ LIVE TEMP
    live_temp = get_temperature(region)

    # 🔥 FINAL TEMP LOGIC (FIXED ✅)
    future_temp = []
    future_promo = []

    for i in range(days):

        # 👉 USE LIVE TEMP BASE (REALISTIC)
        if live_temp:
            t = live_temp + np.sin(i / 3) * 2   # small natural variation
        else:
            t = data["Temperature"].iloc[-1]

        # 👉 PROMOTION LOGIC
        p = 1 if i % 7 == 0 else 0   # weekly promo

        future_temp.append(round(t, 1))
        future_promo.append(int(p))

    return {
        "sarimax": sarimax,
        "xgboost": xgboost,
        "hybrid": hybrid,

        "metrics": metrics,

        # 🔥 NOW REALISTIC
        "temperature": future_temp,
        "promotion": future_promo,

        "live_temp": live_temp,

        "explanation": explain(data, hybrid, region, live_temp),
        "confidence": confidence(hybrid),
        "business": business_impact(metrics, region)
    }