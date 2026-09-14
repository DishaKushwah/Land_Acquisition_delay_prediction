import React from "react";

export default function RiskBadge({ category }) {
  const normalized = String(category || "Unscored").toLowerCase();

  let label = "UNSCORED";
  let className = "badge-unscored";

  if (normalized === "high") {
    label = "HIGH";
    className = "badge-high";
  } else if (normalized === "medium") {
    label = "MEDIUM";
    className = "badge-medium";
  } else if (normalized === "low") {
    label = "LOW";
    className = "badge-low";
  }

  return (
    <span className={`risk-badge ${className}`}>
      <span className="risk-dot" />
      {label}
    </span>
  );
}