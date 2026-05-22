# HireSense AI Deployment

## MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write permissions.
3. Add your backend host IP to Network Access. For Render, use `0.0.0.0/0` for quick hackathon deployment, then tighten it for production.
4. Copy the SRV URI and set `MONGO_URI`.

## Backend on Render

Use `backend/render.yaml` or create a Web Service manually:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Required environment variables:

- `NODE_ENV=production`
- `PORT=5000`
- `MONGO_URI=<atlas-uri>`
- `JWT_SECRET=<long-random-secret>`
- `CLIENT_URL=https://your-vercel-domain.vercel.app`
- `AI_PROVIDER=gemini` or `openai`
- `GEMINI_API_KEY=<optional-if-using-gemini>`
- `OPENAI_API_KEY=<optional-if-using-openai>`

For multiple frontend origins, set `CLIENT_URL` as a comma-separated list.

## Frontend on Vercel

Use the `frontend` directory as the Vercel project root.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-render-api.onrender.com/api` (must end with `/api`, not the bare Render host)

On Render, either set `CLIENT_URL` to your exact Vercel URL, or set `ALLOW_VERCEL_PREVIEWS=true` to allow any `*.vercel.app` preview deployment.

`frontend/vercel.json` includes the SPA rewrite required for React Router.
