import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  redirect,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import dmSansLatin from "@/assets/fonts/dm-sans-latin-wght-normal.woff2?url";
import manropeLatin from "@/assets/fonts/manrope-latin-wght-normal.woff2?url";
import cairoArabic from "@/assets/fonts/cairo-arabic-wght-normal.woff2?url";
import cairoLatin from "@/assets/fonts/cairo-latin-wght-normal.woff2?url";

// Preload only the fonts the first screen needs (headings and body in the visitor's language).
const fontPreloads = (lang?: string) =>
  (lang === "ar" ? [cairoArabic, cairoLatin] : [dmSansLatin, manropeLatin]).map((href) => ({
    rel: "preload", href, as: "font", type: "font/woff2", crossOrigin: "anonymous" as const,
  }));

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider, useLanguage } from "@/lib/language";
import { savedLanguage, siteOrigin } from "@/lib/lang-detect";
import { loadCatalog } from "@/lib/catalog.functions";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("A little off the trail.", "خارج المسار قليلًا.")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("This page could not be found. Your next adventure is still waiting.", "لم نعثر على هذه الصفحة. مغامرتك القادمة ما زالت تنتظرك.")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Go home", "الرئيسية")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const { t } = useLanguage();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("This page did not load", "تعذر تحميل الصفحة")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Please try again or head back home.", "يرجى المحاولة مرة أخرى أو العودة للرئيسية.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Try again", "حاول مجددًا")}
          </Button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("Go home", "الرئيسية")}
          </a>
        </div>
      </div>
    </div>
  );
}

const arPath = (path: string) => "/ar" + (path === "/" ? "" : path);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:site_name", content: "Earth Adventure" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      ...fontPreloads(loaderData?.lang),
      ...(loaderData
        ? [
            { rel: "canonical", href: loaderData.origin + (loaderData.lang === "ar" ? arPath(loaderData.path) : loaderData.path) },
            { rel: "alternate", hrefLang: "en", href: loaderData.origin + loaderData.path },
            { rel: "alternate", hrefLang: "ar", href: loaderData.origin + arPath(loaderData.path) },
            { rel: "alternate", hrefLang: "x-default", href: loaderData.origin + loaderData.path },
          ]
        : []),
    ],
  }),
  // Trips, prices, images and departures come from the D1 database (built-in content if D1 is not connected).
  loader: async ({ location }) => {
    // The URL decides the language: /ar/... is Arabic, everything else English.
    const loc = location as { publicHref?: string; href?: string; pathname: string; searchStr?: string };
    const pub = loc.publicHref ?? loc.href ?? loc.pathname;
    const isAr = /^\/ar(?:[/?#]|$)/.test(pub);
    // Returning visitors who chose Arabic before keep getting Arabic (search engines send no cookie).
    if (!isAr && savedLanguage() === "ar") {
      throw redirect({ href: "/ar" + (loc.pathname === "/" ? "" : loc.pathname) + (loc.searchStr ?? "") });
    }
    return { lang: (isAr ? "ar" : "en") as "ar" | "en", path: loc.pathname, origin: siteOrigin(), catalog: await loadCatalog() };
  },
  staleTime: 30_000,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const data = Route.useLoaderData() as { lang?: "en" | "ar" } | undefined;
  const lang = data?.lang === "ar" ? "ar" : "en";
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { lang } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <LanguageProvider initial={lang}><SiteShell><Outlet /></SiteShell></LanguageProvider>
    </QueryClientProvider>
  );
}
