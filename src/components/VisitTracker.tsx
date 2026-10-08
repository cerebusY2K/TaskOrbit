"use client";

import { useEffect } from "react";
import { isStandalone, nativePlatform } from "@/lib/native";

let sent = false;

export function VisitTracker() {
  useEffect(() => {
    if (sent || navigator.webdriver || location.pathname.startsWith("/admin")) return;
    sent = true;
    const params = new URLSearchParams(location.search);
    const platform = nativePlatform();
    const body = JSON.stringify({
      path: location.pathname,
      referrer: document.referrer || null,
      utm: params.get("utm_source") || params.get("ref"),
      source: platform !== "web" ? platform : isStandalone() ? "installed" : "web",
    });
    if (navigator.sendBeacon?.("/api/visit", new Blob([body], { type: "text/plain" }))) return;
    void fetch("/api/visit", { method: "POST", body, keepalive: true }).catch(() => undefined);
  }, []);
  return null;
}
