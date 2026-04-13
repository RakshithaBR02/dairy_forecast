import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from xgboost import XGBRegressor


class HybridModel:
    def __init__(self):
        self.sarimax = None
        self.xgb = None

    def train(self, df):
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')

        y = df['Demand']
        exog = df[['Temperature', 'Promotion']]

        self.sarimax = SARIMAX(
            y, exog=exog,
            order=(1,1,1),
            seasonal_order=(1,1,1,7)
        ).fit(disp=False)

        df['lag1'] = df['Demand'].shift(1)
        df['lag7'] = df['Demand'].shift(7)
        df = df.dropna()

        X = df[['lag1','lag7','Temperature','Promotion']]
        y = df['Demand']

        self.xgb = XGBRegressor(n_estimators=100)
        self.xgb.fit(X, y)

    def predict(self, df, days=30):
        df = df.sort_values('Date')
        last = df.iloc[-1]

        future_exog = np.tile([[last['Temperature'], last['Promotion']]], (days,1))
        sarimax_pred = self.sarimax.forecast(steps=days, exog=future_exog)

        lag1 = last['Demand']
        lag7 = last['Demand']
        xgb_preds = []

        for _ in range(days):
            x = np.array([[lag1, lag7, last['Temperature'], last['Promotion']]])
            pred = self.xgb.predict(x)[0]
            xgb_preds.append(pred)
            lag1 = pred

        hybrid = (np.array(sarimax_pred) + np.array(xgb_preds)) / 2

        return {
            "sarimax": list(sarimax_pred),
            "xgboost": list(xgb_preds),
            "hybrid": list(hybrid)
        }