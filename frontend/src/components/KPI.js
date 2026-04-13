import React from "react";

export default function KPI({ title, value }) {
  return (
    <div className="kpi-card">
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}