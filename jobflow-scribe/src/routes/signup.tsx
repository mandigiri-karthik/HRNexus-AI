import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — Career Access" },
      {
        name: "description",
        content: "Create a free Career Access account and find your realistic UK career.",
      },
      { property: "og:title", content: "Sign up — Career Access" },
      {
        property: "og:description",
        content: "Create a free account and find your realistic UK career.",
      },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
