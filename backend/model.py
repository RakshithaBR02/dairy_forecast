import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from xgboost import XGBRegressor


class HybridModel:
    def __init__(self):
        self.sarimax = None
        self.xgb = None

    def train(self, df):
        # 🔥 SAFE COPY
        df = df.copy()

        # 🔥 FIX COLUMN ISSUES
        df.columns = df.columns.str.strip()

        if 'Date' not in df.columns:
            raise ValueError(f"Date column missing. Found: {df.columns}")

        # 🔥 DATE PROCESSING (ONLY ONCE)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        df.set_index('Date', inplace=True)

        # TARGET
        y = df['Demand']
        exog = df[['Temperature', 'Promotion']]

        # 🔥 SARIMAX MODEL
        self.sarimax = SARIMAX(
            y,
            exog=exog,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 7),
            enforce_stationarity=False,
            enforce_invertibility=False
        ).fit(disp=False)

        # 🔥 FEATURE ENGINEERING
        df['lag1'] = df['Demand'].shift(1)
        df['lag7'] = df['Demand'].shift(7)

        df = df.dropna()

        X = df[['lag1', 'lag7', 'Temperature', 'Promotion']]
        y = df['Demand']

        # 🔥 XGBOOST
        self.xgb = XGBRegressor(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=5
        )

        self.xgb.fit(X, y)

    def predict(self, df, days=30):

        # 🔥 SAFE COPY
        df = df.copy()
        df.columns = df.columns.str.strip()

        if 'Date' not in df.columns:
            raise ValueError(f"Date column missing in predict. Found: {df.columns}")

        # 🔥 DATE PROCESSING (ONLY ONCE)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        df.set_index('Date', inplace=True)

        # 🔥 HANDLE EMPTY DATA
        if len(df) == 0:
            return {
                "sarimax": [0]*days,
                "xgboost": [0]*days,
                "hybrid": [0]*days
            }

        last = df.iloc[-1]

        # 🔥 FUTURE EXOG
        future_exog = np.tile(
            [[last['Temperature'], last['Promotion']]],
            (days, 1)
        )

        # 🔥 SARIMAX PREDICTION
        sarimax_pred = self.sarimax.forecast(
            steps=days,
            exog=future_exog
        )

        # 🔥 XGBOOST PREDICTION
        lag1 = last['Demand']
        lag7 = df['Demand'].iloc[-7] if len(df) >= 7 else lag1

        xgb_preds = []

        for i in range(days):
            x = np.array([[lag1, lag7, last['Temperature'], last['Promotion']]])
            pred = self.xgb.predict(x)[0]

            xgb_preds.append(pred)

            lag7 = lag1
            lag1 = pred

        # 🔥 HYBRID
        hybrid = (np.array(sarimax_pred) + np.array(xgb_preds)) / 2

        return {
            "sarimax": list(map(float, sarimax_pred)),
            "xgboost": list(map(float, xgb_preds)),
            "hybrid": list(map(float, hybrid))
        }