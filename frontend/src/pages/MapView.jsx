import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import client from "../api/client";

// Approximate state centroids for plotting until real GIS/lat-lon fields
// (see PostGIS in the backend) are populated from survey data.
const STATE_COORDS = {
  "Uttar Pradesh": [26.8467, 80.9462],
  "Maharashtra": [19.7515, 75.7139],
  "Rajasthan": [27.0238, 74.2179],
  "Madhya Pradesh": [22.9734, 78.6569],
  "Gujarat": [22.2587, 71.1924],
  "Bihar": [25.0961, 85.3131],
  "Odisha": [20.9517, 85.0985],
  "Telangana": [18.1124, 79.0193],
  "Karnataka": [15.3173, 75.7139],
  "Punjab": [31.1471, 75.3412],
};

const RISK_COLOR = { High: "#d92b2b", Medium: "#e0a300", Low: "#2fa84f" };

export default function MapView() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    client.get("/projects/").then((res) => setProjects(res.data));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>State-wise Risk Map</h2>
        <MapContainer center={[22.5, 79]} zoom={5} id="map">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {projects.map((p) => {
            const coords = STATE_COORDS[p.state];
            if (!coords) return null;
            return (
              <CircleMarker
                key={p.id}
                center={coords}
                radius={10}
                pathOptions={{
                  color: RISK_COLOR[p.risk_category] || "#888",
                  fillColor: RISK_COLOR[p.risk_category] || "#888",
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <strong>{p.project_code}</strong> — {p.district}, {p.state}
                  <br />
                  Risk: {p.risk_category || "Unscored"}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
