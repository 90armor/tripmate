/**
 * Runs once when the Next.js server starts and validates configuration so a
 * missing or invalid variable stops the server immediately.
 *
 * Node-only code lives in ./instrumentation-node and is imported behind the
 * NEXT_RUNTIME check so it is excluded from the Edge bundle. NEXT_RUNTIME is set
 * by Next.js itself (not application config), so reading it here does not bypass
 * the validated env module.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateConfigurationOrExit } = await import("./instrumentation-node");
    await validateConfigurationOrExit();
  }
}
