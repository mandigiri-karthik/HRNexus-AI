import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shows the page only to logged-in users; everyone else is sent to /login.
export default function ProtectedRoute({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}
