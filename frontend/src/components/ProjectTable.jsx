import React from "react";
import RiskBadge from "./RiskBadge.jsx";

export default function ProjectTable({
  projects,
  onSelect,
  selectedId,
}) {
  return (
    <div className="project-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Stage</th>
            <th>Delay probability</th>
            <th>Risk</th>
            <th>Top driver</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => {
            const probability =
              p.delay_probability != null
                ? `${(p.delay_probability * 100).toFixed(0)}%`
                : "Unscored";

            return (
              <tr
                key={p.id}
                className={`row-clickable ${
                  selectedId === p.id ? "selected-project-row" : ""
                }`}
                onClick={() => onSelect(p)}
              >
                <td>
                  <div className="project-code">{p.project_code}</div>
                  <div className="project-sub">
                    {p.district}, {p.state}
                  </div>
                </td>

                <td>{p.approval_stage}</td>

                <td>
                  <span className="probability-value">
                    {probability}
                  </span>
                </td>

                <td>
                  <RiskBadge category={p.risk_category} />
                </td>

                <td className="top-driver">
                  {p.top_delay_drivers || "Not scored"}
                </td>
              </tr>
            );
          })}

          {projects.length === 0 && (
            <tr>
              <td colSpan="5" className="empty-table">
                No projects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}