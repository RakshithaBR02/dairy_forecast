import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceDot
} from "recharts";

// 🔥 FULL TOOLTIP (ALL VALUES FIXED)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {

    // 🔥 extract all model values properly
    let sarimax, xgboost, hybrid, temp, promo;

    payload.forEach(p => {
      if (p.dataKey === "sarimax") sarimax = p.value;
      if (p.dataKey === "xgboost") xgboost = p.value;
      if (p.dataKey === "hybrid") hybrid = p.value;

      // extra fields come from payload
      temp = p.payload.temp;
      promo = p.payload.promo;
    });

    return (
      <div style={{
        background: "#1e293b",
        padding: "12px",
        borderRadius: "10px",
        color: "white",
        fontSize: "13px",
        boxShadow: "0 0 10px rgba(0,0,0,0.4)"
      }}>
        <p><b>📅 {label}</b></p>

        {/* 🔥 MODEL VALUES */}
        <p>🔵 Hybrid: <b>{hybrid?.toFixed(2)}</b></p>
        <p>🟠 SARIMAX: <b>{sarimax?.toFixed(2)}</b></p>
        <p>🟢 XGBoost: <b>{xgboost?.toFixed(2)}</b></p>

        {/* 🔥 EXTRA DATA */}
        {temp !== undefined && (
          <p>🌦 Temp: <b>{temp}°C</b></p>
        )}

        {promo !== undefined && (
          <p>🎯 Promotion: <b>{promo ? "Yes" : "No"}</b></p>
        )}

        {/* 🔥 SMART REASON */}
        <p style={{ marginTop: "6px", color: "#38bdf8" }}>
          {temp > 35
            ? "High temperature increased demand"
            : promo
            ? "Promotion boosted demand"
            : "Stable demand pattern"}
        </p>
      </div>
    );
  }
  return null;
};

export default function ChartView({ data }) {

  if (!data || data.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  const peak = data.reduce((max, d) =>
    d.hybrid > max.hybrid ? d : max, data[0]
  );

  const isWeekend = (dateStr) => {
    if (!dateStr || dateStr.includes("Week") || dateStr.includes("Month")) return false;
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid stroke="#444" strokeDasharray="3 3" />

        <XAxis
          dataKey="day"
          tick={{ fill: "#ccc", fontSize: 12 }}
          tickFormatter={(value) => {
            if (!value) return "";
            if (value.includes("Week") || value.includes("Month")) return value;

            const d = new Date(value);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />

        <YAxis tick={{ fill: "#ccc" }} />

        {/* 🔥 TOOLTIP */}
        <Tooltip content={<CustomTooltip />} />

        <Legend />

        {/* 🔥 TODAY LINE */}
        <ReferenceLine
          x={today}
          stroke="#facc15"
          strokeDasharray="3 3"
          label={{ value: "Today", fill: "#facc15", position: "top" }}
        />

        {/* 🔥 SARIMAX */}
        <Line
          type="monotone"
          dataKey="sarimax"
          stroke="#ff9800"
          strokeWidth={2}
          dot={false}
        />

        {/* 🔥 XGBOOST */}
        <Line
          type="monotone"
          dataKey="xgboost"
          stroke="#00e676"
          strokeWidth={2}
          dot={false}
        />

        {/* 🔥 HYBRID */}
        <Line
          type="monotone"
          dataKey="hybrid"
          stroke="#03a9f4"
          strokeWidth={3}
          dot={(props) => {
            const { cx, cy, payload } = props;

            if (payload && isWeekend(payload.day)) {
              return <circle cx={cx} cy={cy} r={5} fill="#facc15" />;
            }

            return <circle cx={cx} cy={cy} r={3} fill="#03a9f4" />;
          }}
        />

        {/* 🔥 PEAK */}
        {peak && peak.day && (
          <ReferenceDot
            x={peak.day}
            y={peak.hybrid}
            r={8}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
          />
        )}

      </LineChart>
    </ResponsiveContainer>
  );
}