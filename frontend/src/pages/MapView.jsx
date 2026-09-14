import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import client from "../api/client";

// Approximate state centroids.
// These are used only for visualization until real
// latitude/longitude GIS fields are available.
const STATE_COORDS = {
  "Uttar Pradesh": [26.8467, 80.9462],
  Maharashtra: [19.7515, 75.7139],
  Rajasthan: [27.0238, 74.2179],
  "Madhya Pradesh": [22.9734, 78.6569],
  Gujarat: [22.2587, 71.1924],
  Bihar: [25.0961, 85.3131],
  Odisha: [20.9517, 85.0985],
  Telangana: [18.1124, 79.0193],
  Karnataka: [15.3173, 75.7139],
  Punjab: [31.1471, 75.3412],
};

const RISK_COLOR = {
  High: "#b8473d",
  Medium: "#c18424",
  Low: "#65784b",
};

const normalizeRisk = (value) => {
  const risk = String(value || "")
    .trim()
    .toLowerCase();

  if (risk === "high") return "High";
  if (risk === "medium") return "Medium";
  if (risk === "low") return "Low";

  return "Unscored";
};

const getDominantRisk = (projects) => {
  const counts = {
    High: 0,
    Medium: 0,
    Low: 0,
  };

  projects.forEach((project) => {
    const risk = normalizeRisk(project.risk_category);

    if (risk !== "Unscored") {
      counts[risk] += 1;
    }
  });

  const scoredTotal =
    counts.High + counts.Medium + counts.Low;

  if (scoredTotal === 0) {
    return {
      category: "Unscored",
      counts,
    };
  }

  const category = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  return {
    category,
    counts,
  };
};

export default function MapView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await client.get("/projects/");

        if (!Array.isArray(data)) {
          throw new Error(
            "Projects API did not return an array."
          );
        }

        setProjects(data);
      } catch (err) {
        console.error("GIS MAP ERROR:", err);

        setError(
          err.response?.data?.detail ||
            err.message ||
            "Unable to load map data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  /*
   * Aggregate projects by state.
   *
   * Instead of rendering thousands of overlapping
   * markers at the same centroid, render one marker
   * per state with its risk distribution.
   */
  const stateData = useMemo(() => {
    const grouped = {};

    projects.forEach((project) => {
      if (!project.state || !STATE_COORDS[project.state]) {
        return;
      }

      if (!grouped[project.state]) {
        grouped[project.state] = [];
      }

      grouped[project.state].push(project);
    });

    return Object.entries(grouped).map(
      ([state, stateProjects]) => {
        const risk = getDominantRisk(stateProjects);

        return {
          state,
          projects: stateProjects,
          count: stateProjects.length,
          category: risk.category,
          counts: risk.counts,
          coords: STATE_COORDS[state],
        };
      }
    );
  }, [projects]);

const totals = useMemo(() => {
  return stateData.reduce(
    (result, state) => {
      result.High += state.counts.High;
      result.Medium += state.counts.Medium;
      result.Low += state.counts.Low;
      result.Unscored +=
        state.count - 
        state.counts.High -
        state.counts.Medium -
        state.counts.Low;

      return result;
    },
    {
      High: 0,
      Medium: 0,
      Low: 0,
      Unscored: 0,
    }
  );
}, [stateData]);

  return (
    <div className="container gis-page">
      <div className="card gis-card">

        <div className="gis-header">
          <div>
            <div className="section-eyebrow">
              Geographic intelligence
            </div>

            <h2 className="section-title">
              State-wise Risk Map
            </h2>

            <p className="gis-description">
              Geographic distribution of monitored land
              acquisition risk across project states.
            </p>
          </div>

          <div className="gis-summary">
            <div className="gis-summary-item">
              <strong>{stateData.length}</strong>
              <span>States</span>
            </div>

            <div className="gis-summary-item">
              <strong>{projects.length.toLocaleString()}</strong>
              <span>Projects</span>
            </div>
          </div>
        </div>

        <div className="gis-map-wrapper">
          {loading ? (
            <div className="gis-map-state">
              Loading geographic risk data...
            </div>
          ) : error ? (
            <div className="gis-map-state gis-map-error">
              {error}
            </div>
          ) : (
            <MapContainer
              center={[22.5, 79]}
              zoom={5}
              scrollWheelZoom={true}
              className="gis-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {stateData.map((state) => {
                const color =
                  RISK_COLOR[state.category] || "#6b7280";

                const radius =
                  state.count >= 500
                    ? 18
                    : state.count >= 250
                    ? 15
                    : 12;

                return (
                  <CircleMarker
                    key={state.state}
                    center={state.coords}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.78,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="gis-popup">
                        <div className="gis-popup-state">
                          {state.state}
                        </div>

                        <div className="gis-popup-count">
                          {state.count.toLocaleString()} projects
                        </div>

                        <div className="gis-popup-risk">
                          <span>
                            High: {state.counts.High}
                          </span>

                          <span>
                            Medium: {state.counts.Medium}
                          </span>

                          <span>
                            Low: {state.counts.Low}
                          </span>
                        </div>

                        <div className="gis-popup-primary">
                          Primary risk:{" "}
                          <strong>
                            {state.category}
                          </strong>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {!loading && !error && (
          <div className="gis-legend">
            <div className="gis-legend-title">
              Risk distribution
            </div>

            <div className="gis-legend-items">

              <div className="gis-legend-item">
                <span
                  className="gis-legend-dot gis-high"
                />
                <span>
                  High{" "}
                  <strong>
                    {totals.High.toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="gis-legend-item">
                <span
                  className="gis-legend-dot gis-medium"
                />
                <span>
                  Medium{" "}
                  <strong>
                    {totals.Medium.toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="gis-legend-item">
                <span
                  className="gis-legend-dot gis-low"
                />
                <span>
                  Low{" "}
                  <strong>
                    {totals.Low.toLocaleString()}
                  </strong>
                </span>
              </div>
      
            </div>
          </div>
        )}

        <div className="gis-note">
          State locations are shown using approximate geographic
          centroids. Project-level coordinates can replace these
          markers when verified GIS latitude/longitude data is
          available.
        </div>

      </div>
    </div>
  );
}