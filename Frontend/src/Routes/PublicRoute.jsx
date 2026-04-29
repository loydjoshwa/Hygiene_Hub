import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/CartContext";

const PublicRoute = ({ children }) => {
  const { currentUser, isSessionActive } = useAuth();

  if (currentUser && isSessionActive()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
