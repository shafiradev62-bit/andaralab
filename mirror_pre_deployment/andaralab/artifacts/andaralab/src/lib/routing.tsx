// routing.tsx — Language-aware routing helpers
//
// All internal links automatically prepend the active locale (/en/ or /id/)
// so manual language switching in links is never required.

import { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLocale, type Locale } from "./locale";

const EXACT_LOCALE_MATCH = /^\/(en|id)(\/|$)/;
const EXCLUDE_PREFIX = /^\/(admin|api|assets)/;

export function buildUrl(locale: Locale, path: string): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/**
 * Prepends `/${locale}` to internal paths.
 * Leaves external URLs, hash links, mailto, tel, and /admin untouched.
 */
export function useLocalizedHref(href: string): string {
  const { locale } = useLocale();

  if (!href) return href;
  if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  if (EXCLUDE_PREFIX.test(href)) return href;

  // Already localized — don't double-prefix
  if (EXACT_LOCALE_MATCH.test(href)) return href;

  // Handle root path
  if (href === "/" || href === "") {
    return buildUrl(locale, "");
  }

  const clean = href.startsWith("/") ? href.slice(1) : href;
  return buildUrl(locale, clean);
}

/** Wrapper around wouter <Link> that auto-localizes internal hrefs. */
export function LLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: any }) {
  const localizedHref = useLocalizedHref(href);
  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}

/**
 * Reads /en/ or /id/ from the URL and syncs into LocaleContext.
 * Only fires when the URL locale prefix actually differs from current locale.
 * Uses a ref to avoid triggering on navigation caused by LocaleNavigator itself.
 */
export function LocaleUrlSync() {
  const [location] = useLocation();
  const { locale, setLocale } = useLocale();
  // Track the last locale we set FROM the URL so we don't re-trigger
  const lastSetFromUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (EXCLUDE_PREFIX.test(location)) return;

    const m = location.match(EXACT_LOCALE_MATCH);
    if (!m) return;

    const urlLocale = m[1] as Locale;
    // Only update if URL locale differs AND we haven't just set this from URL
    if (urlLocale !== locale && lastSetFromUrlRef.current !== urlLocale) {
      lastSetFromUrlRef.current = urlLocale;
      setLocale(urlLocale);
    }
  }, [location]); // intentionally omit locale/setLocale to avoid re-triggering

  return null;
}

/**
 * When the user toggles locale via the UI button, update the URL to match.
 * Guards against re-running when the URL change itself caused the locale change.
 */
export function LocaleNavigator() {
  const [location, navigate] = useLocation();
  const { locale } = useLocale();
  const prevLocaleRef = useRef(locale);
  // Track navigations we initiated so LocaleUrlSync doesn't echo them back
  const navigatingRef = useRef(false);

  useEffect(() => {
    const prevLocale = prevLocaleRef.current;

    // No change — nothing to do
    if (prevLocale === locale) return;

    prevLocaleRef.current = locale;

    // Skip admin/api
    if (EXCLUDE_PREFIX.test(location)) return;

    // Check if URL already has the correct locale prefix
    const currentUrlLocale = location.match(EXACT_LOCALE_MATCH)?.[1];
    if (currentUrlLocale === locale) {
      // URL already correct — this locale change came FROM the URL (LocaleUrlSync)
      // Don't navigate again
      return;
    }

    // User clicked the locale button — update the URL
    navigatingRef.current = true;
    const hasPrefix = EXACT_LOCALE_MATCH.test(location);
    const newPath = hasPrefix
      ? location.replace(/^\/(en|id)/, `/${locale}`)
      : `/${locale}${location === "/" ? "" : location}`;

    navigate(newPath, { replace: true });

    // Reset flag after navigation settles
    setTimeout(() => { navigatingRef.current = false; }, 100);
  }, [locale]); // only locale — not location, to avoid re-running on every nav

  return null;
}
