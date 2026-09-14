import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Landmark } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MapView from "./pages/MapView.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <>
      {isAuthenticated && (
        <nav className="navbar">
          <div className="brand">
            <Landmark size={20} />
            <div>
              Land Risk Intelligence
              <div className="brand-sub">Predictive Operations Centre</div>
            </div>
          </div>
          <div>
            <Link to="/">Dashboard</Link>
            <Link to="/map">GIS Map</Link>
            <button className="btn" onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
