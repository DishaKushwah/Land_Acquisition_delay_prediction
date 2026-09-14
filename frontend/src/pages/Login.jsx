import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Could not validate credentials");
    }
  };

  return (
    <div className="login-page">

      {/* LEFT PANEL */}
      <section className="login-intro">

        <div className="login-intro-inner">

          <div className="login-eyebrow">
            LAND ACQUISITION · RISK INTELLIGENCE
          </div>

          <h1>
            Predict before
            <br />
            delays happen.
          </h1>

          <p className="login-intro-copy">
            A predictive operations platform for identifying,
            explaining and acting on land acquisition delay risk
            before it impacts project delivery.
          </p>

          <div className="login-capabilities">

            <div className="login-capability">
              <span>01</span>
              <div>
                <strong>Early detection</strong>
                <small>Identify projects moving toward delay.</small>
              </div>
            </div>

            <div className="login-capability">
              <span>02</span>
              <div>
                <strong>Explainable risk</strong>
                <small>Understand the factors driving each prediction.</small>
              </div>
            </div>

            <div className="login-capability">
              <span>03</span>
              <div>
                <strong>Actionable intervention</strong>
                <small>Turn risk signals into corrective action.</small>
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* LOGIN PANEL */}
      <section className="login-panel">

        <div className="login-card">

          <div className="login-card-header">

            <div className="login-card-eyebrow">
              SECURE ACCESS
            </div>

            <h2>
              Land Acquisition
              <br />
              Risk Dashboard
            </h2>

            <p>
              Sign in to access project intelligence and
              predictive risk monitoring.
            </p>

          </div>


          <form onSubmit={handleSubmit} className="login-form">

            {error && (
              <div className="login-error" role="alert">
                <span className="login-error-mark">!</span>

                <div>
                  <strong>{error}</strong>
                  <span>Check your email and password and try again.</span>
                </div>
              </div>
            )}


            <label className="login-field">

              <span>Email address</span>

              <div className="login-input-wrap">
                <Mail size={17} strokeWidth={1.7} />

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

            </label>


            <label className="login-field">

              <span>Password</span>

              <div className="login-input-wrap">
                <LockKeyhole size={17} strokeWidth={1.7} />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

            </label>


            <button
              type="submit"
              className="login-submit"
            >
              <span>Sign in</span>
              <ArrowRight size={17} strokeWidth={2} />
            </button>

          </form>


          <div className="login-footer">
            <span className="login-footer-line" />
            <span>Authorised project monitoring personnel</span>
            <span className="login-footer-line" />
          </div>

        </div>

      </section>

    </div>
  );
}