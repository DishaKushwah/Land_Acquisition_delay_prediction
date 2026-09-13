import React from "react";
import RiskBadge from "./RiskBadge.jsx";
import client from "../api/client";

export default function ProjectTable({ projects, onScored }) {
  const scoreProject = async (id) => {
    await client.post(`/risk/predict/${id}`);
    onScored();
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Project</th>
          <th>State / District</th>
          <th>Type</th>
          <th>Risk</th>
          <th>Delay Prob.</th>
          <th>Top Drivers</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id}>
            <td>{p.project_code}</td>
            <td>{p.state} / {p.district}</td>
            <td>{p.project_type}</td>
            <td><RiskBadge category={p.risk_category} /></td>
            <td>{p.delay_probability ? `${(p.delay_probability * 100).toFixed(0)}%` : "—"}</td>
            <td>{p.top_delay_drivers || "—"}</td>
            <td>
              <button onClick={() => scoreProject(p.id)}>Score</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
