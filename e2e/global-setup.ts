import { apiUrl, resetDemo } from './helpers.ts'

/** Fails early with a clear message when the backend is not running, then resets the demo data. */
export default async function globalSetup(): Promise<void> {
  try {
    const res = await fetch(apiUrl('/api/health'))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    throw new Error(
      `The backend does not answer at ${apiUrl('/api/health')} (${String(err)}). Start hacknation-backend ` +
        '(`npm run start:dev`, in-memory storage) or set BACKEND_DIR to its folder; A11Y_API_URL sets the address.',
    )
  }
  await resetDemo()
}
