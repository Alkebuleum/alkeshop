// Sets the browser tab title (and what search results show) for a page:
// "<title> · AlkeShop", back to the site title when the page closes.
import { useEffect } from "react";

const SITE_TITLE = typeof document === "undefined" ? "AlkeShop" : document.title;

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · AlkeShop` : SITE_TITLE;
    return () => { document.title = SITE_TITLE; };
  }, [title]);
}
