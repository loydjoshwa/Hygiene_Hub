import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/CartContext";

const AdminProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  const storedUserStr = localStorage.getItem("currentUser");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const role = currentUser?.role || storedUser?.role;
  const token = localStorage.getItem("access_token");

  const isAuthorized = role === "admin" && token;

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AdminProtectedRoute;
