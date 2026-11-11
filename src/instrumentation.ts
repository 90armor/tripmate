/**
 * Runs once when the Next.js server starts. Importing the env module validates
 * configuration so a missing or invalid variable stops the server immediately.
 *
 * Next.js catches errors thrown here, logs them, and keeps listening while
 * answering every request with HTTP 500. That is not "fail early", so a config
 * error exits the process explicitly.
 *
 * NEXT_RUNTIME is set by Next.js itself (not application config), so reading it
 * here does not bypass the validated env module.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    await import("@/lib/env");
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
