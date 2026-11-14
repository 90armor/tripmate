/**
 * Regenerates the committed ISO 4217 snapshot (ROADMAP D13) from SIX's
 * List One XML. Tooling script, not application code; no dependency.
 *
 *   1. Download https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
 *      (linked from SIX "Data standards"; the "currrency" typo is in SIX's URL).
 *   2. pnpm exec tsx src/db/seed/import-iso-4217.ts path/to/list-one.xml
 *   3. Review the diff of src/db/seed/iso-4217-list-one.json, then `pnpm db:seed`.
 *
 * Rules (D13):
 *   - codes without minor units ("N.A." — precious metals, bond units, XDR, XSU,
 *     XUA, the testing code XTS and "no currency" XXX) are excluded;
 *   - ISO fund codes (CcyNm IsFund="true", e.g. USN "US Dollar (Next day)", CLF)
 *     are excluded: they are accounting units, not currencies travelers spend;
 *   - one entry per code (List One repeats a currency for every country using it).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ISO_4217_SOURCE_URL =
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml";

export type Iso4217Currency = { code: string; name: string; minorUnits: number };

/** Parses SIX List One XML into unique currencies with numeric minor units. */
export function parseListOne(xml: string): { publishedOn: string; currencies: Iso4217Currency[] } {
  const published = /<ISO_4217\s+Pblshd="(\d{4}-\d{2}-\d{2})"/.exec(xml)?.[1];
  if (!published) throw new Error("Not an ISO 4217 List One file (no Pblshd date).");

  const byCode = new Map<string, Iso4217Currency>();
  for (const [, entry] of xml.matchAll(/<CcyNtry>([\s\S]*?)<\/CcyNtry>/g)) {
    const code = /<Ccy>([^<]*)<\/Ccy>/.exec(entry!)?.[1]?.trim();
    const nameMatch = /<CcyNm(\s[^>]*)?>([^<]*)<\/CcyNm>/.exec(entry!);
    const name = nameMatch?.[2]?.trim();
    const isFund = /\bIsFund\s*=\s*"true"/i.test(nameMatch?.[1] ?? "");
    const units = /<CcyMnrUnts>([^<]*)<\/CcyMnrUnts>/.exec(entry!)?.[1]?.trim();
    // Entries such as ANTARCTICA have no currency at all.
    if (!code || !name || !units) continue;
    if (!/^\d$/.test(units)) continue; // "N.A.": no minor units (excluded by D13)
    if (isFund) continue; // ISO fund code (excluded by D13)
    if (!/^[A-Z]{3}$/.test(code)) throw new Error(`Unexpected currency code "${code}".`);

    const currency = { code, name: decodeXml(name), minorUnits: Number(units) };
    const existing = byCode.get(code);
    if (
      existing &&
      (existing.name !== currency.name || existing.minorUnits !== currency.minorUnits)
    ) {
      throw new Error(`Conflicting List One entries for ${code}.`);
    }
    byCode.set(code, currency);
  }
  const currencies = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
  if (currencies.length < 100) throw new Error(`Only ${currencies.length} currencies parsed.`);
  return { publishedOn: published, currencies };
}

function decodeXml(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: tsx src/db/seed/import-iso-4217.ts <list-one.xml>");
  const { publishedOn, currencies } = parseListOne(readFileSync(input, "utf8"));
  const snapshot = {
    source: ISO_4217_SOURCE_URL,
    list: "ISO 4217 List One (current currency & funds)",
    publishedOn,
    retrievedOn: new Date().toISOString().slice(0, 10),
    excluded:
      'Per ROADMAP D13: codes without minor units (N.A.) and ISO fund codes (IsFund="true")',
    currencies,
  };
  const out = fileURLToPath(new URL("./iso-4217-list-one.json", import.meta.url));
  writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${currencies.length} currencies (published ${publishedOn}) to ${out}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
