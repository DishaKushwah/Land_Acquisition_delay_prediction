import React, { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  AlertTriangle,
  Gauge,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

import client from "../api/client";

import ProjectTable from "../components/ProjectTable.jsx";
import KpiCard from "../components/KpiCard.jsx";
import ExplainablePanel from "../components/ExplainablePanel.jsx";
import StateRiskChart from "../components/StateRiskChart.jsx";
import PriorityAlerts from "../components/PriorityAlerts.jsx";
import ProjectSelector from "../components/ProjectSelector.jsx";


export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [riskFilter, setRiskFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =========================================================
     LOAD ALL PROJECTS
     ========================================================= */

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       * Fetch the complete project list.
       * Risk/state/search filtering happens locally below.
       */
      const { data } = await client.get("/projects/");

      console.log("PROJECT API DATA:", data);
      console.log("IS ARRAY:", Array.isArray(data));
      console.log("PROJECT COUNT:", data?.length);

      if (!Array.isArray(data)) {
        throw new Error("Projects API did not return an array.");
      }

      setProjects(data);

      /*
       * Keep the currently selected project in sync
       * after a refresh.
       */
      if (selected) {
        const refreshed = data.find(
          (project) => project.id === selected.id
        );

        if (refreshed) {
          setSelected(refreshed);
        }
      }
    } catch (err) {
      console.error("PROJECT FETCH ERROR:", err);

      setProjects([]);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load project data."
      );
    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    fetchProjects();
  }, []);


  /* =========================================================
     STATES
     ========================================================= */

  const states = useMemo(() => {
    return [
      ...new Set(
        projects
          .map((project) => project.state)
          .filter(Boolean)
      ),
    ].sort();
  }, [projects]);


  /* =========================================================
     LOCAL FILTERING
     ========================================================= */

  const filtered = useMemo(() => {
    const selectedRisk = String(riskFilter || "")
      .trim()
      .toLowerCase();

    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const projectRisk = String(
        project.risk_category || ""
      )
        .trim()
        .toLowerCase();

      const matchesRisk =
        !selectedRisk ||
        projectRisk === selectedRisk;

      const matchesState =
        !stateFilter ||
        project.state === stateFilter;

      const matchesSearch =
        !query ||
        String(project.project_code || "")
          .toLowerCase()
          .includes(query) ||
        String(project.district || "")
          .toLowerCase()
          .includes(query);

      return (
        matchesRisk &&
        matchesState &&
        matchesSearch
      );
    });
  }, [
    projects,
    riskFilter,
    stateFilter,
    search,
  ]);


  /* =========================================================
     RISK COUNTS
     ========================================================= */

  const getRiskCategory = (project) =>
    String(project.risk_category || "")
      .trim()
      .toLowerCase();


  const highRiskCount = projects.filter(
    (project) =>
      getRiskCategory(project) === "high"
  ).length;


  const mediumRiskCount = projects.filter(
    (project) =>
      getRiskCategory(project) === "medium"
  ).length;


  const lowRiskCount = projects.filter(
    (project) =>
      getRiskCategory(project) === "low"
  ).length;


  /* =========================================================
     AVERAGE DELAY PROBABILITY
     ========================================================= */

  const scoredProjects = projects.filter(
    (project) =>
      project.delay_probability != null
  );


  const avgDelay = scoredProjects.length
    ? Math.round(
        (
          scoredProjects.reduce(
            (sum, project) =>
              sum + Number(
                project.delay_probability
              ),
            0
          ) / scoredProjects.length
        ) * 100
      )
    : 0;


  /* =========================================================
     COMPENSATION BACKLOG
     ========================================================= */

  const pendingCompCount = projects.filter(
    (project) =>
      String(
        project.compensation_status || ""
      ).toLowerCase() === "pending"
  ).length;


  /* =========================================================
     PROJECT SELECTION
     ========================================================= */

const handleProjectSelect = async (project) => {
  setSelected(project);
  setSelectedDetails(null);

  /*
   * Keep the selector/search synchronized
   * with the selected project.
   */
  if (project?.project_code) {
    setSearch(project.project_code);
  }

  try {
    const { data } = await client.post(
      `/risk/predict/${project.id}`
    );

    setSelectedDetails(data);
  } catch (error) {
    console.error(
      "Failed to load project risk details:",
      error
    );
  }
};

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="container">

      {/* =====================================================
          HERO
          ===================================================== */}

      <div className="page-header">
        <div className="hero-copy">

          <div className="eyebrow">
            Predictive Operations Centre
          </div>

          <h1>
            Land Acquisition
            <br />
            Delay Risk
          </h1>

          <p>
            Predictive portfolio monitoring for early
            detection, explanation and intervention
            across acquisition stages.
          </p>

          <div className="header-actions">
            <button
              className="btn"
              onClick={fetchProjects}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh data"}
            </button>
          </div>

        </div>
      </div>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="error-banner">
          <AlertTriangle size={17} />

          <span>{error}</span>
        </div>
      )}


      {/* =====================================================
          PORTFOLIO OVERVIEW
          ===================================================== */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <div className="section-eyebrow">
              Portfolio overview
            </div>

            <h2 className="section-title">
              Acquisition risk at a glance
            </h2>
          </div>
        </div>


        <div className="kpi-grid">

          <KpiCard
            label="Projects monitored"
            value={
              loading
                ? "—"
                : projects.length.toLocaleString()
            }
            note={
              loading
                ? "Loading project portfolio"
                : `Across ${states.length} states`
            }
            icon={Landmark}
          />


          <KpiCard
            label="High-risk projects"
            value={
              loading
                ? "—"
                : highRiskCount.toLocaleString()
            }
            note="Immediate attention"
            icon={AlertTriangle}
            accent="#b8473d"
          />


          <KpiCard
            label="Average delay probability"
            value={
              loading
                ? "—"
                : `${avgDelay}%`
            }
            note={
              loading
                ? "Calculating"
                : `${highRiskCount} high · ${mediumRiskCount} medium · ${lowRiskCount} low`
            }
            icon={Gauge}
          />


          <KpiCard
            label="Compensation pending"
            value={
              loading
                ? "—"
                : pendingCompCount.toLocaleString()
            }
            note="Awaiting payout"
            icon={IndianRupee}
            accent="#5f7654"
          />

        </div>

      </section>


      {/* =====================================================
          RISK REGISTER
          ===================================================== */}

      <section className="card risk-register">

        <div className="section-heading">

          <div>
            <div className="section-eyebrow">
              Risk landscape
            </div>

            <h2 className="section-title">
              Portfolio risk register
            </h2>
          </div>

        </div>


        {/* ---------------------------------------------------
            PROJECT SELECTOR
            --------------------------------------------------- */}

        <div className="project-selector-section">

          <ProjectSelector
            projects={projects}
            selected={selected}
            onSelect={handleProjectSelect}
          />

        </div>


        {/* ---------------------------------------------------
            FILTERS
            --------------------------------------------------- */}

        <div className="filter-row">

          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(
                event.target.value
              )
            }
            aria-label="Filter by risk level"
          >
            <option value="">
              All risk levels
            </option>

            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>
          </select>


          <select
            value={stateFilter}
            onChange={(event) =>
              setStateFilter(
                event.target.value
              )
            }
            aria-label="Filter by state"
          >
            <option value="">
              All states
            </option>

            {states.map((state) => (
              <option
                key={state}
                value={state}
              >
                {state}
              </option>
            ))}

          </select>

        </div>


        {/* ---------------------------------------------------
            TABLE COUNT
            --------------------------------------------------- */}

        <div className="table-toolbar">

          <div className="table-note">
            Showing{" "}
            <strong>
              {filtered.length.toLocaleString()}
            </strong>{" "}
            of{" "}
            <strong>
              {projects.length.toLocaleString()}
            </strong>{" "}
            projects
          </div>

          {(riskFilter ||
            stateFilter ||
            search) && (
            <button
              className="table-clear-filters"
              onClick={() => {
                setRiskFilter("");
                setStateFilter("");
                setSearch("");
              }}
            >
              Clear filters
            </button>
          )}

        </div>


        {/* ---------------------------------------------------
            TABLE
            --------------------------------------------------- */}

        {loading ? (
          <div className="table-state">
            Loading project portfolio...
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-state">
            No projects match the current filters.
          </div>
        ) : (
        <ProjectTable
          projects={filtered}
          onSelect={handleProjectSelect}
          selectedId={selected?.id}
        />
        )}

      </section>


      {/* =====================================================
          SELECTED PROJECT INTELLIGENCE
          ===================================================== */}

      <ExplainablePanel
        project={selected}
        details={selectedDetails}
      />


      {/* =====================================================
          ANALYTICS / DECISION SUPPORT
          ===================================================== */}

      <div className="dashboard-two-column">

        <div className="card">

          <div className="section-eyebrow">
            Geographic comparison
          </div>

          <h2 className="section-title">
            State risk concentration
          </h2>

          <StateRiskChart
            projects={projects}
          />

        </div>


        <div className="card">

          <div className="section-eyebrow">
            Decision support
          </div>

          <h2 className="section-title">
            Priority alerts
          </h2>

          <PriorityAlerts
            projects={projects}
          />

        </div>

      </div>

    </div>
  );
}