import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

const friendly = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
    queryCache: new QueryCache({ onError: (e) => toast.error(friendly(e)) }),
    mutationCache: new MutationCache({ onError: (e) => toast.error(friendly(e)) }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
