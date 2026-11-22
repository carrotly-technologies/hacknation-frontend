// Appearance settings from /ustawienia, applied before the first paint so a saved dark theme never
// flashes light. Same key and attributes as applyPreferences() in src/lib/preferences.ts.
// A file, not an inline <script>: the Content-Security-Policy (nginx.conf) allows scripts from 'self' only.
try {
  var p = JSON.parse(localStorage.getItem('kompas.prefs') || '{}') || {}
  var r = document.documentElement
  if (p.theme === 'light' || p.theme === 'dark') {
    r.setAttribute('data-theme', p.theme)
    r.style.colorScheme = p.theme
  }
  if (p.highContrast === true) r.setAttribute('data-contrast', 'high')
  if (p.textSize === 125 || p.textSize === 150) r.style.fontSize = p.textSize + '%'
} catch {
  // storage blocked: the defaults apply
}
