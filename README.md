# HireSense AI

HireSense AI is a production-ready MERN mock interview platform with resume-aware question generation, timed chat interviews, AI answer evaluation, analytics, and career improvement roadmaps.

## Highlights

- JWT authentication with secure password hashing and protected routes
- Resume uploads for PDF, DOC, and DOCX with text extraction, candidate profiling, role-fit signals, skills intelligence, risk flags, and interview focus areas
- Dynamic interview planning with resume-aware probes, weighted competencies, role-based scenarios, and adaptive follow-up behavior
- AI evaluation with rubric scores, evidence, communication signals, interviewer replies, follow-up questions, strengths, weaknesses, suggestions, confidence, and hire signal
- Analytics dashboard for trends, weak signals, recent history, and score cards
- Futuristic dark SaaS UI with TailwindCSS, Framer Motion, responsive layouts, skeletons, empty states, toast notifications, and error boundaries
- Express MVC backend with Helmet, CORS, rate limiting, validation, centralized error handling, and environment configuration

## Tech Stack

Frontend: React, Vite, TailwindCSS, React Router DOM, Axios, Framer Motion, Lucide React.

Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, Multer, pdf-parse, Mammoth.

AI: Gemini or OpenAI. Use one real API key for production behavior. If no key is configured, the backend uses polished fallback responses so hackathon demos still run.

## Folder Structure

```text
hiresense-ai/
  frontend/
    src/
      api/
      components/
      context/
      data/
      layouts/
      pages/
      utils/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
      validators/
    uploads/
  docs/
```

## Local Setup

```bash
npm run install:all
```

Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with MongoDB Atlas and AI credentials:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/hiresense-ai
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
AI_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
```

Run the API:

```bash
npm run dev:backend
```

Run the frontend in another terminal:

```bash
npm run dev:frontend
```

Open `http://localhost:5173`.

## API Routes

Base URL: `/api`

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/auth/me` | Current authenticated user |
| `POST` | `/resumes` | Upload and analyze resume |
| `GET` | `/resumes` | List resume metadata |
| `GET` | `/resumes/:id` | Resume details |
| `POST` | `/interviews` | Generate interview questions |
| `GET` | `/interviews` | List interview history |
| `GET` | `/interviews/:id` | Interview, questions, and feedback |
| `POST` | `/interviews/:id/questions/:questionId/answer` | Evaluate answer |
| `POST` | `/interviews/:id/complete` | Complete interview and create roadmap |
| `GET` | `/analytics` | Stats, trends, weaknesses, recent history |

## Database Models

- `User`: profile, email, hashed password, role, target role
- `Resume`: upload metadata, extracted text, AI analysis
- `Interview`: user, resume, role, difficulty, AI interview plan, transcript, competency scores, aggregate score, roadmap
- `Question`: prompt, category, source, difficulty reason, expected signals, evaluation rubric, time limit, order
- `Feedback`: answer, rubric scores, evidence, communication signals, interviewer reply, adaptive follow-up, hire signal, score

## Screenshots

Add screenshots after deployment:

- `docs/screenshots/landing.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/interview-room.png`
- `docs/screenshots/analytics.png`

## Deployment

Frontend deploys to Vercel using `frontend/vercel.json`.

Backend deploys to Render using `backend/render.yaml`.

See [docs/deployment.md](docs/deployment.md) for exact environment variables, MongoDB Atlas setup, and production CORS notes.

## Production Notes

- Set a strong `JWT_SECRET`.
- Set `CLIENT_URL` to your Vercel URL in production.
- Keep uploaded files on persistent storage for long-term production. Render disks, S3, or Cloudinary are better than ephemeral container storage.
- Add request logging and monitoring before public launch.
- Tighten MongoDB Atlas IP access after demo deployment.
