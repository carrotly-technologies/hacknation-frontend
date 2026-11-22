/** "Chrome 131 · Windows" from a User-Agent, for the activity monitor; the raw string stays in `title`. */
export function describeUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'nieznana'
  const version = (re: RegExp) => re.exec(ua)?.[1]?.split('.')[0]
  let browser: string
  if (/HeadlessChrome|Playwright|puppeteer/i.test(ua)) browser = 'Przeglądarka automatyczna'
  else if (/Edg(e|A|iOS)?\//.test(ua)) browser = `Edge ${version(/Edg(?:e|A|iOS)?\/([\d.]+)/) ?? ''}`
  else if (/OPR\//.test(ua)) browser = `Opera ${version(/OPR\/([\d.]+)/) ?? ''}`
  else if (/Firefox\/|FxiOS\//.test(ua)) browser = `Firefox ${version(/(?:Firefox|FxiOS)\/([\d.]+)/) ?? ''}`
  else if (/Chrome\/|CriOS\//.test(ua)) browser = `Chrome ${version(/(?:Chrome|CriOS)\/([\d.]+)/) ?? ''}`
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = `Safari ${version(/Version\/([\d.]+)/) ?? ''}`
  else if (/^curl\//i.test(ua)) browser = 'curl'
  else if (/PostmanRuntime/i.test(ua)) browser = 'Postman'
  else browser = ua.split(/[\s/]/)[0] || 'nieznana'

  let os = ''
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS'
  else if (/CrOS/.test(ua)) os = 'ChromeOS'
  else if (/Linux/.test(ua)) os = 'Linux'
  return [browser.trim(), os].filter(Boolean).join(' · ')
}
