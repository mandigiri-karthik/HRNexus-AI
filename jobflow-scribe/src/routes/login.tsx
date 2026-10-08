import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Log in — Career Access" },
      {
        name: "description",
        content: "Log in to continue your UK career journey with Career Access.",
      },
      { property: "og:title", content: "Log in — Career Access" },
      { property: "og:description", content: "Log in to continue your UK career journey." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthForm mode="login" redirect={redirect} />;
}
