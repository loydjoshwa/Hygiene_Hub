import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const adminLogged = localStorage.getItem("adminLogged") === "true";
  const adminEmail = localStorage.getItem("adminEmail");

  if (!adminLogged || !adminEmail) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AdminProtectedRoute;
