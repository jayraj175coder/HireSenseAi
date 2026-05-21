import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Analytics from "./pages/Analytics";
import AuthPage from "./pages/AuthPage";
import Completion from "./pages/Completion";
import Dashboard from "./pages/Dashboard";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewSetup from "./pages/InterviewSetup";
import Landing from "./pages/Landing";
import ResumeUpload from "./pages/ResumeUpload";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resumes" element={<ResumeUpload />} />
          <Route path="/interview/new" element={<InterviewSetup />} />
          <Route path="/interview/:id" element={<InterviewRoom />} />
          <Route path="/interview/:id/complete" element={<Completion />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Route>
    </Routes>
  );
}
