import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

// The logged-in app: the sidebar on the left, the current page on the right.
export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
}