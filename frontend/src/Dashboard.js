import React, { useState, useEffect } from "react";
import { getForecast } from "./api";
import ChartView from "./components/ChartView";
import "./styles.css";

export default function Dashboard() {

  const [product, setProduct] = useState("Milk");
  const [days, setDays] = useState(7);
  const [region, setRegion] = useState("Bangalore");
  const [mode, setMode] = useState("daily");

  const [raw, setRaw] = useState(null);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [extra, setExtra] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔥 GRAPH DATA
  useEffect(() => {
    if (!raw) return;

    const today = new Date();

    let chartData = raw.hybrid.map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i + 1);

      return {
        day: d.toISOString().split("T")[0],
        sarimax: raw.sarimax?.[i] ?? 0,
        xgboost: raw.xgboost?.[i] ?? 0,
        hybrid: raw.hybrid?.[i] ?? 0,
        temp: raw.temperature?.[i],
        promo: raw.promotion?.[i]
      };
    });

    // WEEKLY
    if (mode === "weekly") {
      let weekly = [];

      chartData.forEach((val, i) => {
        const w = Math.floor(i / 7);

        if (!weekly[w]) {
          weekly[w] = { day: `Week ${w+1}`, sarimax:0, xgboost:0, hybrid:0 };
        }

        weekly[w].sarimax += val.sarimax;
        weekly[w].xgboost += val.xgboost;
        weekly[w].hybrid += val.hybrid;
      });

      chartData = weekly;
    }

    // MONTHLY
    if (mode === "monthly") {
      chartData = [{
        day: "Next Month",
        sarimax: chartData.reduce((a,b)=>a+b.sarimax,0),
        xgboost: chartData.reduce((a,b)=>a+b.xgboost,0),
        hybrid: chartData.reduce((a,b)=>a+b.hybrid,0)
      }];
    }

    setData(chartData);

  }, [raw, mode]);

  // 🔥 API CALL
  const handlePredict = async () => {
    setLoading(true);

    try {
      const res = await getForecast(product, days, region);
      setRaw(res);
      setMetrics(res.metrics);
      setExtra(res);
    } catch {
      alert("API error");
    }

    setLoading(false);
  };

  return (
    <div className="container">

      <h1 className="title">🥛 Dairy Demand Forecast</h1>

      <div className="card" style={{ textAlign: "center" }}>

        {/* ✅ FIXED DROPDOWN (ALL PRODUCTS) */}
        <select value={product} onChange={(e)=>setProduct(e.target.value)}>
          <option>Milk</option>
          <option>Curd</option>
          <option>Butter</option>
          <option>Cheese</option>
          <option>Yogurt</option>
          <option>Laban</option>
        </select>

        <select value={region} onChange={(e)=>setRegion(e.target.value)}>
          <option>Bangalore</option>
          <option>Delhi</option>
          <option>Mumbai</option>
        </select>

        <select value={days} onChange={(e)=>setDays(Number(e.target.value))}>
          <option value={7}>7 Days</option>
          <option value={30}>30 Days</option>
        </select>

        <button onClick={handlePredict}>
          {loading ? "⏳ Loading..." : "✨ Generate Forecast"}
        </button>
      </div>

      {data.length > 0 && (
        <div className="card">

          <h3>📈 Demand Prediction (Hybrid vs SARIMAX vs XGBoost)</h3>

          <div className="toggle">
            <button className={mode==="daily"?"active":""} onClick={()=>setMode("daily")}>Daily</button>
            <button className={mode==="weekly"?"active":""} onClick={()=>setMode("weekly")}>Weekly</button>
            <button className={mode==="monthly"?"active":""} onClick={()=>setMode("monthly")}>Monthly</button>
          </div>

          <ChartView data={data} />
        </div>
      )}

      {metrics.total && (
        <div className="card">
          <h3>📊 Production Insights</h3>

          <div className="kpi">
            <div className="kpi-box"><h4>Total</h4><p>{metrics.total}</p></div>
            <div className="kpi-box"><h4>Avg</h4><p>{metrics.average}</p></div>
            <div className="kpi-box"><h4>Peak</h4><p>{metrics.peak}</p></div>
          </div>
        </div>
      )}

      {extra.explanation && (
        <div className="card">
          <h3>🧠 Forecast Insights</h3>
          <p>{extra.explanation}</p>
        </div>
      )}

      {extra.business && (
        <div className="card">
          <h3>💰 Business Recommendation</h3>
          <p>{extra.business}</p>
        </div>
      )}

    </div>
  );
}