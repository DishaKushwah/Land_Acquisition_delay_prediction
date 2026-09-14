import React from "react";

export default function KpiCard({ label, value, note, icon: Icon, accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">
        <span>{label}</span>
        {Icon && <Icon size={16} color={accent || "#6b7280"} />}
      </div>
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}
