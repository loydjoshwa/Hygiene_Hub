import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/CartContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  const storedUserStr = localStorage.getItem("currentUser");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const role = currentUser?.role || storedUser?.role;

  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
