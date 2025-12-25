/**
 * Next.js instrumentation file
 * Runs on server startup to validate environment
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvironment } = await import('./lib/env-validation')
    validateEnvironment()
  }
}




