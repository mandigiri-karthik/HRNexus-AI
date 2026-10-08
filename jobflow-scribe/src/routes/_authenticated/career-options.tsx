import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { JourneyStepper, PageTitle } from "@/components/journey";
import { ListSkeleton } from "@/components/bits";
import { qk } from "@/lib/queries";
import { CareerSuggester } from "@/components/career-suggester";

export const Route = createFileRoute("/_authenticated/career-options")({
  head: () => ({
    meta: [
      { title: "Career options — Career Access" },
      { name: "description", content: "Realistic UK career options based on your experience." },
      { property: "og:title", content: "Career options — Career Access" },
      {
        property: "og:description",
        content: "Realistic UK career options based on your experience.",
      },
    ],
  }),
  component: CareerOptionsPage,
});

function CareerOptionsPage() {
  const { data, isLoading } = useQuery(qk.options);

  return (
    <div className="space-y-6">
      <JourneyStepper current={2} />
      <PageTitle
        title="Your career options"
        intro="Three realistic directions based on your experience."
      />

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <CareerSuggester initialOptions={data} />
      )}
    </div>
  );
}
