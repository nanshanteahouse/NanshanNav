/** Match the management route without treating paths such as /administrator as admin. */
export function isAdminPath(
  pathname = typeof window === "undefined" ? "" : window.location.pathname,
): boolean {
  return /^\/admin(?:\/|$)/.test(pathname);
}

/** Reload the published dashboard with its own public page state. */
export function navigateToPublicDashboard() {
  window.location.assign("/");
}
