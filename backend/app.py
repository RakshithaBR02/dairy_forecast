from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

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

# Train model once
model = HybridModel()
model.train(df)


# Explanation function
def explain(df, preds):
    recent = df.tail(7)

    avg_demand = recent["Demand"].mean()
    last_demand = df.iloc[-1]["Demand"]

    avg_temp = recent["Temperature"].mean()
    last_temp = df.iloc[-1]["Temperature"]

    promo_days = recent["Promotion"].sum()

    trend = preds[-1] - preds[0]

    text = ""

    if trend > 5:
        text += f"Demand is increasing from {round(preds[0],1)} to {round(preds[-1],1)} units. "
    elif trend < -5:
        text += f"Demand is decreasing from {round(preds[0],1)} to {round(preds[-1],1)} units. "
    else:
        text += "Demand remains stable over the forecast period. "

    if last_demand > avg_demand:
        text += "Recent demand is above weekly average, indicating rising consumption. "
    else:
        text += "Recent demand is slightly below average, indicating mild slowdown. "

    if last_temp > avg_temp:
        text += f"Higher temperature ({round(last_temp,1)}°C) is increasing dairy consumption. "
    else:
        text += f"Lower temperature ({round(last_temp,1)}°C) may reduce consumption slightly. "

    if promo_days > 0:
        text += f"{int(promo_days)} promotional days contributed to demand increase. "

    text += "Weekly seasonal patterns captured by SARIMAX are influencing demand behavior."

    return text


# Confidence function
def confidence(preds):
    std = np.std(preds)

    if std < 5:
        return "High"
    elif std < 15:
        return "Medium"
    else:
        return "Low"


# Business impact function
def business_impact(metrics):
    total = metrics["total"]

    if total > 3000:
        return "High demand forecast detected. Increase production capacity and ensure supply chain readiness to avoid shortages."
    elif total > 1500:
        return "Moderate demand expected. Maintain balanced production and closely monitor fluctuations."
    else:
        return "Lower demand forecast detected. It is recommended to reduce production levels to avoid excess inventory and minimize storage and wastage costs."


# API endpoint
@app.get("/predict")
def predict(product: str = "Milk", days: int = 30):
    data = df[df["Product"] == product]

    preds = model.predict(data, days)

    # Convert numpy to Python float
    sarimax = [float(x) for x in preds["sarimax"]]
    xgboost = [float(x) for x in preds["xgboost"]]
    hybrid = [float(x) for x in preds["hybrid"]]

    metrics = calculate_metrics(hybrid)

    return {
        "sarimax": sarimax,
        "xgboost": xgboost,
        "hybrid": hybrid,
        "metrics": metrics,
        "explanation": explain(data, hybrid),
        "confidence": confidence(hybrid),
        "business": business_impact(metrics)
    }