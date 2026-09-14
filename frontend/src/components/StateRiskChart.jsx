import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const RISK_COLORS = {
  high: "#b8473d",
  medium: "#c18424",
  low: "#65784b",
  unscored: "#a3adb5",
};

const normalizeRisk = (value) => {
  const risk = String(value || "")
    .trim()
    .toLowerCase();

  if (risk === "high") return "high";
  if (risk === "medium") return "medium";
  if (risk === "low") return "low";

  return "unscored";
};

export default function StateRiskChart({ projects = [] }) {
  const data = useMemo(() => {
    const grouped = {};

    projects.forEach((project) => {
      if (!project.state) return;

      if (!grouped[project.state]) {
        grouped[project.state] = {
          state: project.state,
          high: 0,
          medium: 0,
          low: 0,
          unscored: 0,
        };
      }

      const risk = normalizeRisk(project.risk_category);

      grouped[project.state][risk] += 1;
    });

    return Object.values(grouped)
      .map((state) => ({
        ...state,
        total:
          state.high +
          state.medium +
          state.low +
          state.unscored,
      }))
      .sort((a, b) => {
        const aRisk = a.high + a.medium;
        const bRisk = b.high + b.medium;

        return bRisk - aRisk;
      })
      .slice(0, 7);
  }, [projects]);

  if (!data.length) {
    return (
      <div className="risk-chart-empty">
        No state risk data available.
      </div>
    );
  }

  return (
    <div className="state-risk-chart">

      <div className="state-risk-chart-header">
        <div>
          <div className="state-risk-chart-label">
            TOP STATES BY RISK LOAD
          </div>

          <p>
            Distribution of monitored projects by
            current risk category.
          </p>
        </div>

        <div className="state-risk-legend">
          <span>
            <i className="legend-high" />
            High
          </span>

          <span>
            <i className="legend-medium" />
            Medium
          </span>

          <span>
            <i className="legend-low" />
            Low
          </span>

          <span>
            <i className="legend-unscored" />
            Unscored
          </span>
        </div>
      </div>

      <div className="state-risk-chart-body">
        <ResponsiveContainer
          width="100%"
          height={330}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 8,
              right: 20,
              left: 8,
              bottom: 8,
            }}
            barCategoryGap="24%"
          >
            <CartesianGrid
              horizontal={false}
              stroke="#e8ecef"
            />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#7b8790",
                fontSize: 11,
              }}
            />

            <YAxis
              type="category"
              dataKey="state"
              width={105}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#344454",
                fontSize: 12,
                fontWeight: 600,
              }}
            />

            <Tooltip
              cursor={{
                fill: "rgba(18, 39, 58, 0.035)",
              }}
              contentStyle={{
                border: "1px solid #dce3e8",
                borderRadius: "9px",
                boxShadow:
                  "0 8px 24px rgba(18,39,58,0.10)",
                fontSize: 12,
              }}
              formatter={(value, name) => [
                value.toLocaleString(),
                name === "high"
                  ? "High"
                  : name === "medium"
                  ? "Medium"
                  : name === "low"
                  ? "Low"
                  : "Unscored",
              ]}
            />

            <Bar
              dataKey="high"
              stackId="risk"
              fill={RISK_COLORS.high}
              name="high"
              radius={[5, 0, 0, 5]}
            />

            <Bar
              dataKey="medium"
              stackId="risk"
              fill={RISK_COLORS.medium}
              name="medium"
            />

            <Bar
              dataKey="low"
              stackId="risk"
              fill={RISK_COLORS.low}
              name="low"
            />

            <Bar
              dataKey="unscored"
              stackId="risk"
              fill={RISK_COLORS.unscored}
              name="unscored"
              radius={[0, 5, 5, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="state-risk-summary">
        {data.slice(0, 3).map((state, index) => {
          const scored =
            state.high +
            state.medium +
            state.low;

          const riskLoad =
            scored > 0
              ? Math.round(
                  ((state.high + state.medium) /
                    scored) *
                    100
                )
              : 0;

          return (
            <div
              className="state-risk-summary-item"
              key={state.state}
            >
              <span className="state-risk-rank">
                0{index + 1}
              </span>

              <div>
                <strong>{state.state}</strong>

                <span>
                  {state.total.toLocaleString()} projects
                </span>
              </div>

              <b>{riskLoad}% risk load</b>
            </div>
          );
        })}
      </div>

    </div>
  );
}