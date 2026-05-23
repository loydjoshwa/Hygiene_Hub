import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/CartContext";

const PublicRoute = ({ children }) => {
  const { currentUser, isSessionActive } = useAuth();

  const storedUserStr = localStorage.getItem("currentUser");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const role = currentUser?.role || storedUser?.role;

  if (currentUser && isSessionActive()) {
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
