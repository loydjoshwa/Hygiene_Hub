import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const adminLogged = localStorage.getItem("adminLogged") === "true";
  const adminEmail = localStorage.getItem("adminEmail");
  const token = localStorage.getItem("access_token");

  // Temporarily allow if either (adminLogged && adminEmail) OR a valid token is present.
  // TODO: Once the Go backend is fully integrated, strictly require 'token'.
  const isAuthorized = (adminLogged && adminEmail) || token;

  if (!isAuthorized) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default AdminProtectedRoute;
