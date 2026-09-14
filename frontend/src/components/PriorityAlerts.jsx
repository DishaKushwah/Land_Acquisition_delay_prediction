import React from "react";
import { IndianRupee, Scale, Users } from "lucide-react";

export default function PriorityAlerts({ projects }) {
  const alerts = [];

  const pendingComp = projects.filter(
    (p) =>
      p.compensation_status === "Pending" &&
      p.risk_category === "High"
  );

  if (pendingComp.length > 0) {
    alerts.push({
      icon: IndianRupee,
      title: "Compensation backlog in high-risk projects",
      body: `${pendingComp.length} high-risk project(s) still show compensation as Pending: ${pendingComp
        .slice(0, 3)
        .map((p) => p.project_code)
        .join(", ")}.`,
    });
  }

  const disputed = projects.filter(
    (p) =>
      p.legal_dispute === "Yes" &&
      p.risk_category !== "Low"
  );

  if (disputed.length > 0) {
    alerts.push({
      icon: Scale,
      title: "Legal disputes affecting delivery",
      body: `${disputed.length} project(s) with active legal disputes are Medium or High risk.`,
    });
  }

  const lowResponsiveness = projects.filter(
    (p) =>
      p.stakeholder_responsiveness === "Low" &&
      p.risk_category === "High"
  );

  if (lowResponsiveness.length > 0) {
    alerts.push({
      icon: Users,
      title: "Stakeholder responsiveness declining",
      body: `${lowResponsiveness.length} high-risk project(s) also show Low stakeholder responsiveness.`,
    });
  }

  if (alerts.length === 0) {
    return (
      <p className="priority-alert-empty">
        No priority alerts right now — score more projects to populate this feed.
      </p>
    );
  }

  return (
    <div className="priority-alert-list">
      {alerts.map((alert, index) => {
        const Icon = alert.icon;

        return (
          <div className="alert-item" key={index}>
            <div className="alert-icon">
              <Icon size={18} strokeWidth={1.8} />
            </div>

            <div className="alert-content">
              <div className="alert-title">
                {alert.title}
              </div>

              <div className="alert-body">
                {alert.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}