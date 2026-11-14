/**
 * Node.js-only startup checks, imported by src/instrumentation.ts.
 *
 * Next.js catches errors thrown during instrumentation, logs them, and keeps
 * listening while answering every request with HTTP 500. That is not "fail
 * early", so a configuration error exits the process explicitly.
 */
export async function validateConfigurationOrExit(): Promise<void> {
  try {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  } catch (error) {
    // Compare by name: the error class may come from a separately bundled module instance.
    if (error instanceof Error && error.name === "EnvValidationError") {
      console.error(
        `\n${error.message}\n\nSee .env.example and the README "Environment setup" section.\n`,
      );
      process.exit(1);
    }
    throw error;
  }
}
