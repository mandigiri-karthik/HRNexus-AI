import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!getCurrentUser()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Outlet />
    </div>
  ),
});
