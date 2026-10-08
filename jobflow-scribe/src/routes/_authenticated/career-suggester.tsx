import { createFileRoute } from "@tanstack/react-router";
import { CareerSuggester } from "@/components/career-suggester";

export const Route = createFileRoute("/_authenticated/career-suggester")({
  head: () => ({
    meta: [
      { title: "Career Suggester — HRNexus AI" },
      {
        name: "description",
        content:
          "Paste a profile JSON and get 3 AI-powered career suggestions. PII is stripped before any data leaves your browser.",
      },
      { property: "og:title", content: "Career Suggester — HRNexus AI" },
    ],
  }),
  component: CareerSuggesterPage,
});

function CareerSuggesterPage() {
  return <CareerSuggester />;
}
