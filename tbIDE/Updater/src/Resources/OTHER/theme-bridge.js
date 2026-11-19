/* Version 2 Windows snapshot contract; mappings belong in winui-baseline.css. */
(function initializeThemeFallback() {
  const mode = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
})();

const winAccentProperties = Object.freeze({
  accentLight3: "--win-accent-light3",
  accentLight2: "--win-accent-light2",
  accentLight1: "--win-accent-light1",
  accent: "--win-accent",
  accentDark1: "--win-accent-dark1",
  accentDark2: "--win-accent-dark2",
  accentDark3: "--win-accent-dark3"
});

let winUIThemePreference = 'system';
let winUISystemMode = document.documentElement.getAttribute?.('data-theme') || 'light';
function setWinUIThemePreference(preference) {
  if (!['system', 'light', 'dark'].includes(preference)) throw new RangeError('Unknown theme preference');
  winUIThemePreference = preference;
  const mode = preference === 'system' ? winUISystemMode : preference;
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.style.colorScheme = mode;
  window.chrome?.webview?.postMessage(JSON.stringify({type:'themePreference',mode:preference}));
  document.dispatchEvent?.(new CustomEvent('themePreferenceChanged', {detail:{preference,mode}}));
}
window.WinUITheme = Object.freeze({setPreference:setWinUIThemePreference, getPreference:()=>winUIThemePreference});
function applyHostTheme(theme) {
  /* Validate the entire snapshot before mutating the root. Rejected messages
     leave the last valid native state (or startup fallback) untouched. */
  if (!theme || (theme.mode !== "light" && theme.mode !== "dark")) return false;
  const colors = [];
  for (const [key, property] of Object.entries(winAccentProperties)) {
    if (typeof theme[key] !== "string" || !/^#[a-f\d]{6}$/i.test(theme[key])) return false;
    colors.push([property, theme[key].toUpperCase()]);
  }
  const root = document.documentElement;
  for (const [property, color] of colors) root.style.setProperty(property, color);
  winUISystemMode = theme.mode;
  const mode = winUIThemePreference === 'system' ? theme.mode : winUIThemePreference;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
  return true;
}

function requestHostTheme(sendToHost) {
  /* WebView2Package 0.0.0.3 decodes scalar JsMessage values, not objects.
     JSON text preserves the structured request through that wrapper. */
  const send = typeof sendToHost === "function" ? sendToHost : message => window.chrome?.webview?.postMessage(JSON.stringify(message));
  send({ type: "requestThemeSnapshot" });
}

function handleHostThemeMessage(message) {
  let value = message;
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { return false; } }
  if (value?.type !== "themeSnapshotResult" || value.schemaVersion !== 2) return false;
  return applyHostTheme(value.theme);
}

/* Register before the embedded page requests its initial snapshot. Windows
   notifications use this same listener and never navigate/reload the page. */
if (window.chrome?.webview) {
  window.chrome.webview.addEventListener("message", event => handleHostThemeMessage(event.data));
}
