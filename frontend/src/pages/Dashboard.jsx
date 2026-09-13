import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import client from "../api/client";
import ProjectTable from "../components/ProjectTable.jsx";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [riskFilter, setRiskFilter] = useState("");

  const fetchProjects = async () => {
    const { data } = await client.get("/projects/", {
      params: riskFilter ? { risk_category: riskFilter } : {},
    });
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, [riskFilter]);

  const summary = ["High", "Medium", "Low"].map((cat) => ({
    category: cat,
    count: projects.filter((p) => p.risk_category === cat).length,
  }));

  return (
    <div className="container">
      <div className="card">
        <h2>Risk Overview</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={summary}>
            <XAxis dataKey="category" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#12213b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Projects</h2>
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="">All risk levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <ProjectTable projects={projects} onScored={fetchProjects} />
      </div>
    </div>
  );
}
