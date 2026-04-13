import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceDot
} from "recharts";

export default function ChartView({ data }) {

  const today = new Date().toISOString().split("T")[0];

  const peak = data.reduce((max, d) =>
    d.hybrid > max.hybrid ? d : max, data[0] || {}
  );

  const isWeekend = (dateStr) => {
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
            if (value.includes("Week") || value.includes("Month")) return value;
            const d = new Date(value);
            return `${d.getDate()}/${d.getMonth()+1}`;
          }}
        />

        <YAxis tick={{ fill: "#ccc" }} />
        <Tooltip
  contentStyle={{ background:"#1e293b", border:"none" }}
  formatter={(value, name) => [`${value.toFixed(2)} units`, name]}
/>
        <Legend />

        {/* 🔥 TODAY LINE */}
        <ReferenceLine
          x={today}
          stroke="#facc15"
          strokeDasharray="3 3"
          label={{ value: "Today", fill: "#facc15", position: "top" }}
        />

        <Line type="monotone" dataKey="sarimax" stroke="#ff9800" dot={false} />
        <Line type="monotone" dataKey="xgboost" stroke="#00e676" dot={false} />

        <Line
          type="monotone"
          dataKey="hybrid"
          stroke="#03a9f4"
          strokeWidth={3}
          dot={(props) => {
            const { cx, cy, payload } = props;

            if (!payload.day.includes("Week") && !payload.day.includes("Month") && isWeekend(payload.day)) {
              return <circle cx={cx} cy={cy} r={5} fill="#facc15" />;
            }

            return <circle cx={cx} cy={cy} r={3} fill="#03a9f4" />;
          }}
        />

        {/* 🔥 PEAK */}
        {peak.day && (
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