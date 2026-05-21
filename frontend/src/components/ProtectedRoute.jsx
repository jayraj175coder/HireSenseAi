import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute() {
  const { user, booting } = useAuth();
  if (booting) return <Spinner fullScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
