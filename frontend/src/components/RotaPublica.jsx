import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RotaPublica() {
  const { usuario } = useAuth();

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
