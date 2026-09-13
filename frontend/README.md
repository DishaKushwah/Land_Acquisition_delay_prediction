# Land Acquisition Delay Dashboard — Frontend (SIH26)

React + Vite + Leaflet + Recharts. Talks to the FastAPI backend via /api (proxied, see vite.config.js).

## Setup
```bash
npm install
npm run dev
```
Make sure the backend is running on http://localhost:8000 first.

## Pages
- /login       -> JWT login (form-encoded, matches FastAPI's OAuth2PasswordRequestForm)
- /            -> Dashboard: risk summary chart + project table with "Score" action
- /map         -> Leaflet map, projects colored by risk category (state centroids for now;
                   swap in real lat/lon once PostGIS survey data is available)
