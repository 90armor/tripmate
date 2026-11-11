export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, skipping falsy values.
 *
 * Deliberately does not resolve Tailwind conflicts: primitives define their own
 * complete styling, and callers pass layout classes (margin, width, alignment)
 * rather than overriding colors or sizes.
 */
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
