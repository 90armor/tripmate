import { z } from "zod";
import snapshot from "./iso-4217-list-one.json";

/*
 * Canonical currency reference data (ROADMAP D13, DATABASE §16): a committed
 * snapshot of ISO 4217 List One. Source URL and publication date are recorded
 * in the JSON file; regenerate it with ./import-iso-4217.ts, never by hand.
 *
 * ISO 4217 has no currency symbols, so `symbol` is null and the UI shows the
 * code ("JPY — Yen"). minor_units comes from ISO, never from Intl.
 */

const snapshotSchema = z.object({
  source: z.url(),
  publishedOn: z.iso.date(),
  currencies: z
    .array(
      z.object({
        code: z.string().regex(/^[A-Z]{3}$/),
        name: z.string().min(1),
        minorUnits: z.number().int().min(0).max(4),
      }),
    )
    .min(100),
});

const parsed = snapshotSchema.parse(snapshot);

export const ISO_4217_SOURCE = { url: parsed.source, publishedOn: parsed.publishedOn };

export type CurrencySeed = {
  readonly code: string;
  readonly name: string;
  readonly symbol: string | null;
  readonly minorUnits: number;
};

export const ISO_4217_CURRENCIES: readonly CurrencySeed[] = parsed.currencies.map((c) => ({
  ...c,
  symbol: null,
}));
