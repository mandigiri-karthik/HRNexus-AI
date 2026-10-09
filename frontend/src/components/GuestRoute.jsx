import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shows the page only to logged-out users; logged-in users go to the dashboard.
// This is also what moves the user on after a successful login or sign-up.
export default function GuestRoute({ children }) {
  const { session } = useAuth();
  return session ? <Navigate to="/" replace /> : children;
}
