import { Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AppLayout from "./components/AppLayout";
import ComingSoonPage from "./pages/ComingSoonPage";
import AssistantPage from "./pages/AssistantPage";

// The list of pages and who may see each one.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<AssistantPage />} />
        <Route path="/jobs" element={<ComingSoonPage title="Jobs" />} />
        <Route path="/review" element={<ComingSoonPage title="Review" />} />
        <Route path="/tracker" element={<ComingSoonPage title="Tracker" />} />
        <Route path="/profile" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
