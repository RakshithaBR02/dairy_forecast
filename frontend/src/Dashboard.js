import React, { useState, useEffect } from "react";
import { getForecast } from "./api";
import ChartView from "./components/ChartView";
import "./styles.css";

export default function Dashboard() {

  const [product, setProduct] = useState("Milk");
  const [days, setDays] = useState(7);
  const [mode, setMode] = useState("daily");

  const [raw, setRaw] = useState(null);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [extra, setExtra] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!raw) return;

    const today = new Date();
    const n = Number(days);

    let chartData = [];

    for (let i = 0; i < n; i++) {
      if (!raw.hybrid[i]) break;

      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i + 1);

      chartData.push({
        day: futureDate.toISOString().split("T")[0],
        sarimax: raw.sarimax[i],
        xgboost: raw.xgboost[i],
        hybrid: raw.hybrid[i]
      });
    }

    if (mode === "weekly") {
      let weekly = [];

      chartData.forEach((val, i) => {
        const w = Math.floor(i / 7);

        if (!weekly[w]) {
          weekly[w] = {
            day: `Week ${w + 1}`,
            sarimax: 0,
            xgboost: 0,
            hybrid: 0
          };
        }

        weekly[w].sarimax += val.sarimax;
        weekly[w].xgboost += val.xgboost;
        weekly[w].hybrid += val.hybrid;
      });

      chartData = weekly;
    }

    if (mode === "monthly") {
      chartData = [{
        day: "Next Month",
        sarimax: chartData.reduce((a,b)=>a+b.sarimax,0),
        xgboost: chartData.reduce((a,b)=>a+b.xgboost,0),
        hybrid: chartData.reduce((a,b)=>a+b.hybrid,0)
      }];
    }

    setData(chartData);

  }, [raw, days, mode]);

  const handlePredict = async () => {
    setLoading(true);

    try {
      const res = await getForecast(product, days);

      await new Promise(r => setTimeout(r, 500));

      setRaw(res);
      setMetrics(res.metrics);
      setExtra(res);

    } catch {
      alert("API error");
    }

    setLoading(false);
  };

  const getConfidenceClass = (level) => {
    if (level === "High") return "confidence-high";
    if (level === "Medium") return "confidence-medium";
    return "confidence-low";
  };

  return (
    <div className="container">

      {/* TITLE */}
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <h1 style={{
          fontSize: "42px",
          fontWeight: "900",
          letterSpacing: "2px",
          background: "linear-gradient(135deg, #38bdf8, #6366f1, #22c55e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          🥛 Dairy Demand Forecast
        </h1>
      </div>

      {/* CONTROLS */}
      <div className="card" style={{ textAlign: "center" }}>

        <select value={product} onChange={(e)=>setProduct(e.target.value)}>
          <option>Milk</option>
          <option>Curd</option>
          <option>Butter</option>
          <option>Laban</option>
          <option>Cheese</option>
          <option>Yogurt</option>
        </select>

        <select value={days} onChange={(e)=>setDays(Number(e.target.value))}>
          <option value={7}>7 Days</option>
          <option value={30}>30 Days</option>
        </select>

        <button onClick={handlePredict}>
          {loading ? "⏳ Predicting..." : "✨ Generate Forecast"}
        </button>
      </div>

      {/* GRAPH */}
      {data.length > 0 && (
        <div className="card">
          <h3>📈 Model Comparison</h3>

          {/* 🔥 NEW LABELS */}
          <h4 style={{ color:"#ccc" }}>Forecast: Next {days} Days</h4>
          <h5 style={{ color:"#888" }}>
            {data[0]?.day} → {data[data.length - 1]?.day}
          </h5>

          <div>
            <button className={mode==="daily"?"active":""} onClick={()=>setMode("daily")}>Daily</button>
            <button className={mode==="weekly"?"active":""} onClick={()=>setMode("weekly")}>Weekly</button>
            <button className={mode==="monthly"?"active":""} onClick={()=>setMode("monthly")}>Monthly</button>
          </div>

          <ChartView data={data} />
        </div>
      )}

      {/* KPI */}
      {metrics.total && (
        <div className="card">
          <h3>📊 Production Insights</h3>

          <div style={{ display:"flex", gap:"10px" }}>
            <div className="kpi-box">Total<br/>{metrics.total}</div>
            <div className="kpi-box">Avg<br/>{metrics.average}</div>
            <div className="kpi-box">Peak<br/>{metrics.peak}</div>
          </div>
        </div>
      )}

      {/* EXPLANATION */}
      {extra.explanation && (
        <div className="card">
          <h3>🧠 Demand Explanation</h3>
          <p>{extra.explanation}</p>
        </div>
      )}

      {/* CONFIDENCE */}
      {extra.confidence && (
        <div className="card">
          <h3>📊 Confidence Level</h3>
          <span className={`confidence-badge ${getConfidenceClass(extra.confidence)}`}>
            {extra.confidence}
          </span>
        </div>
      )}

      {/* BUSINESS */}
      {extra.business && (
        <div className="card">
          <h3>💰 Business Insight</h3>
          <p>{extra.business}</p>
        </div>
      )}

    </div>
  );
}