import React from "react";

export default function RiskBadge({ category }) {
  const cls =
    category === "High" ? "badge-high" : category === "Medium" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{category || "Unscored"}</span>;
}
