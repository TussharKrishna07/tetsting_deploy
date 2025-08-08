# React + Vite + Flask Backend

Minimal full‑stack setup: React (Vite) frontend + Flask backend.

Backend endpoints:
- `GET /api/hello` greeting JSON with timestamp
- `GET /api/health` simple health check

Frontend automatically fetches `/api/hello` on load and shows result.

## Run Locally
Create a virtual environment (recommended):
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install JS deps (if not already):
```bash
npm install
```

Start backend:
```bash
npm run backend
```

In another terminal start frontend:
```bash
npm run dev
```

Open http://localhost:5173

The dev proxy in `vite.config.js` forwards `/api/*` to http://127.0.0.1:5000

## Build Frontend
```bash
npm run build
```
Outputs static assets to `dist/`.

## Deployment Ideas
Option A: Deploy Flask (Render/Railway/Fly) and static frontend (Netlify/Vercel). Use an env var (e.g. `VITE_API_BASE`) instead of relative `/api` and update fetch.

Option B: Single container: build frontend then serve `dist/` via Flask or a production server (gunicorn + whitenoise / send_from_directory). Not implemented yet.

## Next Steps
- Add `VITE_API_BASE` variable usage
- Add tests with pytest
- Add Dockerfile & production WSGI server

## Scripts
- `npm run dev` Vite dev server
- `npm run backend` Flask dev server
- `npm run build` Production build
- `npm run preview` Preview built assets

