import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Arabic lives under /ar (e.g. /ar/reviews) so Google can index it separately; English keeps the plain URLs.
// `input` strips /ar when a URL comes in, `output` adds it back to every link the site builds.
// A new router is created per request, so `prefix` is never shared between visitors.
export const getRouter = () => {
  const queryClient = new QueryClient();
  const touchOnly = typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;
  let prefix = "";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Start loading a page's data before the click, so navigation feels instant instead of waiting ~1s for the database.
    //  - computers (mouse): as soon as the pointer hovers a link ("intent")
    //  - phones / tablets (touch, no hover): as soon as a link appears on screen ("viewport"), because a tap
    //    gives no earlier warning than the tap itself.
    // Loaded data is reused for 30s (same as the root loader).
    defaultPreload: touchOnly ? "viewport" : "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 30_000,
    defaultStaleTime: 30_000,
    rewrite: {
      input: ({ url }) => {
        if (url.pathname === "/ar" || url.pathname.startsWith("/ar/")) {
          prefix = "/ar";
          url.pathname = url.pathname.slice(3) || "/";
        } else {
          prefix = "";
        }
        return url;
      },
      output: ({ url }) => {
        if (prefix) url.pathname = prefix + (url.pathname === "/" ? "" : url.pathname);
        return url;
      },
    },
  });

  return router;
};
