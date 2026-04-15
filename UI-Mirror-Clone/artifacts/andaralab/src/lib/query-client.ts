// TanStack Query client configuration
//
// Caching strategy:
// - datasets: staleTime 5min, gcTime 10min — data changes infrequently
// - posts/pages: staleTime 0 — always fresh so CMS edits show immediately
// - mutations: onSuccess invalidates queries to trigger refetch

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 seconds — CMS edits show within 30s
      gcTime:    1000 * 60 * 10,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
