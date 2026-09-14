import React from "react";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Users,
  Scale,
  IndianRupee,
  FileCheck,
  Home,
  Activity,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import RiskBadge from "./RiskBadge.jsx";


function statusClass(value) {
  if (!value) return "";

  const v = String(value).toLowerCase();

  if (
    v.includes("pending") ||
    v.includes("yes") ||
    v.includes("low")
  ) {
    return "status-warning";
  }

  if (
    v.includes("completed") ||
    v.includes("no") ||
    v.includes("high")
  ) {
    return "status-good";
  }

  return "";
}


function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="info-item">

      <div className="info-icon">
        <Icon size={16} />
      </div>

      <div>
        <div className="info-label">
          {label}
        </div>

        <div className={`info-value ${statusClass(value)}`}>
          {value ?? "—"}
        </div>
      </div>

    </div>
  );
}


function getStageRisk(details, stage) {
  const risks = details?.stage_risks;

  if (!risks) {
    return null;
  }

  // Backend may return an array
  if (Array.isArray(risks)) {
    return (
      risks.find(
        (item) =>
          String(item.stage || "")
            .toLowerCase() === stage.toLowerCase()
      ) || null
    );
  }

  // Backend may return an object keyed by stage
  if (typeof risks === "object") {
    const direct =
      risks[stage] ||
      risks[stage.toLowerCase()] ||
      risks[stage.toUpperCase()];

    if (direct != null) {
      if (typeof direct === "number") {
        return {
          probability: direct,
          risk_category: riskLevel(direct),
        };
      }

      return direct;
    }
  }

  return null;
}


function riskLevel(probability) {
  if (probability >= 0.7) return "High";
  if (probability >= 0.4) return "Medium";
  return "Low";
}


export default function ExplainablePanel({
  project,
  details,
}) {

  if (!project) {
    return (
      <div className="empty-intelligence">

        <ShieldCheck size={24} />

        <h3>
          Select a project
        </h3>

        <p>
          Search for a project above to view its acquisition
          indicators, predicted delay risk, contributing factors,
          stage-wise risk and recommended interventions.
        </p>

      </div>
    );
  }


  const probability =
    project.delay_probability != null
      ? Math.round(
          project.delay_probability * 100
        )
      : null;


  const drivers =
    details?.top_delay_drivers ||
    (project.top_delay_drivers || "")
      .split(",")
      .map((d) => ({
        feature: d.trim(),
        impact: null,
      }))
      .filter((d) => d.feature);


  const stageRisks = [
    {
      key: "Notification",
      label: "Notification",
    },
    {
      key: "Approval",
      label: "Approval",
    },
    {
      key: "Compensation",
      label: "Compensation",
    },
    {
      key: "Possession",
      label: "Possession",
    },
  ].map((stage) => {
    const result = getStageRisk(
      details,
      stage.key
    );
      const stageProbability =
        result?.probability ??
        result?.delay_probability ??
        result?.risk_probability ??
        result?.risk_score ??
        null;

      return {
        ...stage,
        probability: stageProbability,
        category:
          result?.risk_category ??
          (stageProbability != null
            ? riskLevel(stageProbability)
            : null),
      };
    });


  const recommendations =
    details?.recommendations || [];


  return (
    <div className="intelligence-panel">

      {/* HEADER */}
      <div className="intelligence-header">

        <div>
          <div className="section-eyebrow">
            Project intelligence
          </div>

          <h2 className="intelligence-title">
            {project.project_code}
          </h2>

          <div className="project-location">
            <MapPin size={14} />
            {project.district}, {project.state}
          </div>
        </div>

        <RiskBadge
          category={project.risk_category}
        />

      </div>


      {/* PROJECT PROFILE */}
<div className="intelligence-section profile-section">

  <div className="intelligence-section-heading">
    <div className="intelligence-section-index">
      01
    </div>

    <div>
      <div className="section-eyebrow">
        Project profile
      </div>

      <div className="intelligence-section-caption">
        Core project and land footprint indicators
      </div>
    </div>
  </div>

  <div className="info-grid profile-grid">

    <InfoItem
      icon={FileCheck}
      label="Project type"
      value={project.project_type}
    />

    <InfoItem
      icon={MapPin}
      label="Land area"
      value={
        project.land_area_hectares != null
          ? `${project.land_area_hectares} hectares`
          : "—"
      }
    />

    <InfoItem
      icon={Users}
      label="Affected families"
      value={project.affected_families}
    />

    <InfoItem
      icon={Clock}
      label="Months since initiation"
      value={project.months_since_initiation}
    />

  </div>

</div>


      {/* ACQUISITION STATUS */}
<div className="intelligence-section acquisition-section">

  <div className="intelligence-section-heading">
    <div className="intelligence-section-index">
      02
    </div>

    <div>
      <div className="section-eyebrow">
        Acquisition status
      </div>

      <div className="intelligence-section-caption">
        Current position across approval, compensation and possession
      </div>
    </div>
  </div>

  <div className="info-grid acquisition-grid">

    <InfoItem
      icon={FileCheck}
      label="Approval stage"
      value={project.approval_stage}
    />

    <InfoItem
      icon={Clock}
      label="Approval timeline"
      value={
        project.approval_timeline_days != null
          ? `${project.approval_timeline_days} days`
          : "—"
      }
    />

    <InfoItem
      icon={IndianRupee}
      label="Compensation"
      value={project.compensation_status}
    />

    <InfoItem
      icon={Scale}
      label="Legal dispute"
      value={project.legal_dispute}
    />

    <InfoItem
      icon={Home}
      label="Possession"
      value={project.possession_status}
    />

  </div>

</div>


      {/* EXECUTION INDICATORS */}
<div className="intelligence-section execution-section">

  <div className="intelligence-section-heading">
    <div className="intelligence-section-index">
      03
    </div>

    <div>
      <div className="section-eyebrow">
        Execution indicators
      </div>

      <div className="intelligence-section-caption">
        Operational readiness and stakeholder performance
      </div>
    </div>
  </div>

  <div className="info-grid execution-grid">

    <InfoItem
      icon={Activity}
      label="Rehabilitation progress"
      value={
        project.rehabilitation_progress_pct != null
          ? `${project.rehabilitation_progress_pct}%`
          : "—"
      }
    />

    <InfoItem
      icon={Users}
      label="Stakeholder responsiveness"
      value={project.stakeholder_responsiveness}
    />

    <InfoItem
      icon={ShieldCheck}
      label="Department performance"
      value={
        project.historical_dept_performance_score != null
          ? `${project.historical_dept_performance_score}/100`
          : "—"
      }
    />

  </div>

</div>
      


      {/* RISK INTELLIGENCE */}
      <div className="risk-intelligence">

        <div className="risk-score">

          <div
            className="risk-score-number"
            style={{
              color:
                project.risk_category === "High"
                  ? "#dc2626"
                  : project.risk_category === "Medium"
                  ? "#d97706"
                  : "#16a34a",
            }}
          >
            {probability !== null
              ? `${probability}%`
              : "—"}
          </div>

          <div className="risk-score-label">
            predicted delay probability
          </div>

          <RiskBadge
            category={project.risk_category}
          />

          <div className="prediction-label">
            Prediction:{" "}
            <strong>
              {project.delay_probability != null
                ? project.delay_probability >= 0.4
                  ? "Delayed"
                  : "On-Time"
                : "Not scored"}
            </strong>
          </div>

        </div>


        {/* DRIVERS */}
        <div className="drivers-panel">

          <div className="section-eyebrow">
            Why is this project at risk?
          </div>

          {drivers.length === 0 ? (
            <p className="muted">
              No contributing factors available.
            </p>
          ) : (
            drivers.slice(0, 5).map((driver, index) => {

              const name =
                driver.feature ||
                driver.name ||
                driver.label ||
                String(driver);

              return (
                <div
                  className="driver-row"
                  key={`${name}-${index}`}
                >

                  <div className="driver-rank">
                    {index + 1}
                  </div>

                  <div className="driver-content">

                    <span>
                      {name}
                    </span>

                    <div className="driver-bar-bg">
                      <div
                        className="driver-bar-fill"
                        style={{
                          width:
                            `${100 - index * 17}%`,
                        }}
                      />
                    </div>

                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>


      {/* STAGE-WISE RISK */}
      <div className="intelligence-section">

        <div className="section-eyebrow">
          Lifecycle risk
        </div>

        <h3 className="subsection-title">
          Stage-wise delay probability
        </h3>

        <div className="stage-risk-grid">

          {stageRisks.map((stage) => {

            const pct =
              stage.probability != null
                ? Math.round(
                    stage.probability * 100
                  )
                : null;

            return (
              <div
                className="stage-risk-card"
                key={stage.key}
              >

                <div className="stage-risk-name">
                  {stage.label}
                </div>

                <div className="stage-risk-value">
                  {pct !== null
                    ? `${pct}%`
                    : "—"}
                </div>

                {stage.category && (
                  <RiskBadge
                    category={stage.category}
                  />
                )}

                <div className="stage-risk-bar">
                  <div
                    className="stage-risk-fill"
                    style={{
                      width:
                        pct !== null
                          ? `${pct}%`
                          : "0%",
                    }}
                  />
                </div>

              </div>
            );
          })}

        </div>

      </div>


      {/* RECOMMENDATIONS */}
      <div className="intelligence-section">

        <div className="section-eyebrow">
          Decision support
        </div>

        <h3 className="subsection-title">
          Recommended interventions
        </h3>

        {recommendations.length === 0 ? (
          <div className="recommendation-empty">
            <AlertTriangle size={16} />
            <span>
              No intervention recommendations returned
              for this project.
            </span>
          </div>
        ) : (
          <div className="recommendation-list">

            {recommendations
              .slice(0, 5)
              .map((recommendation, index) => {

                const text =
                  typeof recommendation === "string"
                    ? recommendation
                    : recommendation.action ||
                      recommendation.recommendation ||
                      recommendation.text ||
                      JSON.stringify(
                        recommendation
                      );

                return (
                  <div
                    className="recommendation-item"
                    key={index}
                  >

                    <div className="recommendation-number">
                      {index + 1}
                    </div>

                    <div className="recommendation-text">
                      {text}
                    </div>

                    <ArrowRight size={15} />

                  </div>
                );
              })}

          </div>
        )}

      </div>


      {/* MODEL NOTE */}
      <div className="model-note">
        <ShieldCheck size={14} />

        Risk generated using the trained XGBoost
        predictive model with native feature contributions
        for explanation.
      </div>

    </div>
  );
}