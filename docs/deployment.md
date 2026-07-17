# Deployment Guide

## MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas.
2. Add a database user and allow access from your deploy targets'
   IPs (or `0.0.0.0/0` for simplicity, tightened later).
3. Copy the connection string into `MONGODB_URI` in `.env`.

## Frontend → Vercel
1. Import the `frontend/` directory as the project root in Vercel.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set env var `VITE_API_BASE_URL` to your deployed backend URL.

## Backend → Railway
1. New project → deploy from repo, root directory `backend/`.
2. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`,
   `AI_SERVICE_URL` (your deployed AI service URL), `FRONTEND_ORIGIN`
   (your deployed frontend URL), `PORT` (Railway sets this automatically —
   the app already reads `process.env.PORT`).
3. Start command: `npm start`.

## AI service → Railway
1. New service in the same Railway project, root directory `ai/`.
2. Set env vars: `OPENAQ_API_KEY`, `OPENWEATHER_API_KEY`, `GEE_PROJECT_ID`
   (optional), `GEMINI_API_KEY` (optional).
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. After first deploy, hit `POST /train` once (via curl or Postman) to
   produce an initial model — the service won't auto-train on boot.

## Environment variable checklist

See `.env.example` at the project root for the full list. Each service
only needs the subset relevant to it, but keeping one shared `.env`
locally (as this repo does) avoids key drift between services.

## Docker Compose (self-hosted / staging)

```bash
docker compose up --build
```

Builds and runs all three services together. Point `MONGODB_URI` at
Atlas (default) or uncomment the local `mongo` service in
`docker-compose.yml` for a fully self-contained stack.
