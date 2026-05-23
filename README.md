# 🚀 HireSense AI – AI Powered Mock Interview Platform

HireSense AI is a full-stack AI-powered mock interview platform that helps students and job seekers prepare for technical interviews using resume-aware AI conversations, real-time answer evaluation, analytics dashboards, and personalized improvement roadmaps.

The platform simulates realistic interviews using Generative AI and provides intelligent feedback on communication, technical accuracy, confidence, and problem-solving skills.

---

# 📌 Selected Problem Statement

### Problem Statement:
Build an AI-powered interview preparation platform that:
- Generates interview questions dynamically
- Evaluates candidate answers intelligently
- Provides personalized improvement feedback
- Helps users prepare for real-world interviews

HireSense AI solves this by creating adaptive mock interviews based on uploaded resumes and target roles.

---

# 🎥 Demo Video

👉 Add your demo video link here:

```bash
https://www.loom.com/share/2b00a0ce9f6c47629f5da58406cfb0c5
```
---

# 🧠 Features & Functionalities

## 🔐 Authentication
- JWT-based Login & Signup
- Secure password hashing
- Protected routes

## 📄 Resume Intelligence
- Upload Resume (PDF/DOC/DOCX)
- Resume text extraction
- Skill analysis
- Candidate profiling
- Risk signal detection
- Role-fit analysis

## 🤖 AI Interview System
- Resume-aware interview generation
- Adaptive follow-up questions
- Role-based interview planning
- Difficulty-based questions
- AI interviewer responses

## 📊 AI Evaluation
- AI-generated scoring
- Communication analysis
- Technical evaluation
- Confidence scoring
- Strengths & weaknesses
- Improvement suggestions

## 📈 Analytics Dashboard
- Interview history
- Score trends
- Weak area detection
- Performance tracking
- Career roadmap generation

## 🎨 Modern UI/UX
- Futuristic SaaS UI
- Dark mode interface
- Fully responsive design
- Smooth animations using Framer Motion
- Skeleton loaders & toast notifications

---

# 🛠 Tech Stack Used

## Frontend
- React.js
- Vite
- TailwindCSS
- React Router DOM
- Axios
- Framer Motion
- Lucide React

## Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Multer

## AI & Resume Processing
- Gemini API / OpenAI API
- pdf-parse
- Mammoth

## Deployment
- Vercel (Frontend)
- Render (Backend)

---

# 🏗 Backend Architecture / System Design
<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/7a1a89c0-df90-4b4a-9943-f887cc7f39e3" />


## Architecture Highlights
- MVC backend structure
- Centralized error handling
- JWT middleware authentication
- AI abstraction layer
- Modular API services
- Resume analysis pipeline

---

# ⚙️ Implementation Approach & Workflow

## Step 1: User Authentication
Users create accounts and securely log in using JWT authentication.

## Step 2: Resume Upload
Users upload resumes which are parsed and analyzed for:
- Skills
- Experience
- Role fit
- Technical stack

## Step 3: Interview Generation
The AI engine generates personalized interview questions based on:
- Resume content
- Target role
- Selected difficulty

## Step 4: Real-time Interview Simulation
Users answer questions in a timed AI-driven chat interface.

## Step 5: AI Evaluation
AI evaluates:
- Technical correctness
- Communication
- Confidence
- Problem-solving approach

## Step 6: Analytics & Feedback
Users receive:
- Score reports
- Improvement suggestions
- Skill gap analysis
- Personalized roadmap

---

# 🤖 APIs / Models / Tools Used

| Tool/API | Purpose |
|---|---|
| Gemini API | AI interview generation |
| OpenAI API | AI answer evaluation |
| MongoDB Atlas | Database |
| JWT | Authentication |
| Multer | File upload |
| pdf-parse | PDF text extraction |
| Mammoth | DOCX parsing |
| Render | Backend hosting |
| Vercel | Frontend deployment |

---

# 📂 Folder Structure

```text
hiresense-ai/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── context/
│   ├── api/
│   └── utils/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   │
│   └── uploads/
│
└── docs/
```

---

# 🔑 Environment Variables Required

## backend/.env

```env
PORT=5000

MONGO_URI=mongodb+srv://<your-mongodb-uri>

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

AI_PROVIDER=gemini

GEMINI_API_KEY=your_gemini_api_key

OPENAI_API_KEY=your_openai_api_key
```

## frontend/.env

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

# 📦 Installation Steps

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/hiresense-ai.git
```

## 2️⃣ Navigate into Project

```bash
cd hiresense-ai
```

## 3️⃣ Install Dependencies

```bash
npm run install:all
```

---

# ▶️ Setup Instructions to Run Locally

## Start Backend

```bash
npm run dev:backend
```

## Start Frontend

```bash
npm run dev:frontend
```

---

# 🌐 Local URLs

Frontend:
```bash
http://localhost:5173
```

Backend:
```bash
http://localhost:5000
```

---

# 📸 Screenshots

## Dashboard
<img width="1611" height="868" alt="image" src="https://github.com/user-attachments/assets/9f3d8139-2e89-42f2-80df-54f06f57b34b" />

## AI Interview
<img width="1867" height="898" alt="image" src="https://github.com/user-attachments/assets/d6f04fcc-63fe-4f50-a7b6-c4290376eca3" />

## Resume Analysis
<img width="1867" height="901" alt="image" src="https://github.com/user-attachments/assets/65b6296e-a07d-4cc3-94f5-543fb73d862a" />

## Analytics Dashboard
<img width="1840" height="911" alt="image" src="https://github.com/user-attachments/assets/1ee0f5c8-8b21-4443-8b2b-b398215e96ae" />

## Performance Report
<img width="1854" height="898" alt="image" src="https://github.com/user-attachments/assets/7b6c79f8-2546-4669-8a56-1d9652ea3509" />

---

# 🚀 Deployment

## Frontend Deployment
- Vercel:https://hire-sense-ai-sigma.vercel.app/

## Backend Deployment
- Render

---

# 🔒 Production Notes

- Use strong JWT secrets
- Store uploaded resumes securely
- Enable MongoDB IP restrictions
- Add logging & monitoring before production launch

---

# 👨‍💻 Author

### Jayraj Sanas

- GitHub: https://github.com/jayraj175coder
- Email: jayrajsanas175@gmail.com

---

# ⭐ Future Improvements

- Voice-based AI interviews
- Video interview support
- AI proctoring
- Multi-language interview support
- ATS Resume Score Checker
- Live coding rounds

---

# 📜 License

This project is developed for hackathon and educational purposes.
