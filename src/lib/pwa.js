let swRegistrationAttempted = false;

export function registerPwaServiceWorker() {
  if (swRegistrationAttempted) return;
  swRegistrationAttempted = true;

  if (!("serviceWorker" in navigator)) return;
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const isSecure = window.location.protocol === "https:" || isLocalhost;
  if (!isSecure) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Service worker registration skipped:", error?.message || error);
    });
  }, { once: true });
}
