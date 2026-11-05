(function () {
  var stored, parsed, settings, themeMode;
  try {
    stored = localStorage.getItem("dashboard-storage");
    if (stored) {
      parsed = JSON.parse(stored);
      settings = parsed?.state?.settings;
      if (settings) {
        if (settings.themeMode) {
          themeMode = settings.themeMode;
        } else if ("darkMode" in settings) {
          themeMode = settings.darkMode ? "dark" : "system";
        }
        if (themeMode === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
        } else if (
          themeMode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
          document.documentElement.setAttribute("data-theme", "dark");
        }
      }
    }
  } catch {}
})();
