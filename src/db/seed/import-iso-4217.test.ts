import { describe, expect, it } from "vitest";
import { parseListOne } from "./import-iso-4217";

const entry = (country: string, name: string, code: string, units: string, fund = false) =>
  `<CcyNtry><CtryNm>${country}</CtryNm><CcyNm${fund ? ' IsFund="true"' : ""}>${name}</CcyNm>` +
  `<Ccy>${code}</Ccy><CcyNbr>000</CcyNbr><CcyMnrUnts>${units}</CcyMnrUnts></CcyNtry>`;

// parseListOne requires at least 100 currencies, so pad with synthetic codes.
const padding = Array.from({ length: 100 }, (_, i) => {
  const code = `Q${String.fromCharCode(65 + Math.floor(i / 26))}${String.fromCharCode(65 + (i % 26))}`;
  return entry("PADLAND", `Pad ${i}`, code, "2");
}).join("");

const xml = (body: string) =>
  `<?xml version="1.0"?><ISO_4217 Pblshd="2026-09-17"><CcyTbl>${body}${padding}</CcyTbl></ISO_4217>`;

describe("parseListOne", () => {
  it("reads code, name, minor units and the publication date", () => {
    const result = parseListOne(xml(entry("JAPAN", "Yen", "JPY", "0")));
    expect(result.publishedOn).toBe("2026-09-17");
    expect(result.currencies.find((c) => c.code === "JPY")).toEqual({
      code: "JPY",
      name: "Yen",
      minorUnits: 0,
    });
  });

  it("keeps one entry per code across countries", () => {
    const result = parseListOne(
      xml(entry("FRANCE", "Euro", "EUR", "2") + entry("GERMANY", "Euro", "EUR", "2")),
    );
    expect(result.currencies.filter((c) => c.code === "EUR")).toHaveLength(1);
  });

  it("excludes N.A. minor units and entries without a currency", () => {
    const result = parseListOne(
      xml(
        entry("ZZ01_Gold", "Gold", "XAU", "N.A.") +
          "<CcyNtry><CtryNm>ANTARCTICA</CtryNm><CcyNm>No universal currency</CcyNm></CcyNtry>",
      ),
    );
    expect(result.currencies.map((c) => c.code)).not.toContain("XAU");
  });

  it('excludes ISO fund codes (IsFund="true") even when they have minor units', () => {
    const result = parseListOne(
      xml(
        entry("CHILE", "Unidad de Fomento", "CLF", "4", true) +
          entry("UNITED STATES OF AMERICA (THE)", "US Dollar (Next day)", "USN", "2", true) +
          entry("UNITED STATES OF AMERICA (THE)", "US Dollar", "USD", "2"),
      ),
    );
    const codes = result.currencies.map((c) => c.code);
    expect(codes).not.toContain("CLF");
    expect(codes).not.toContain("USN");
    expect(codes).toContain("USD");
  });

  it("decodes XML entities in names", () => {
    const result = parseListOne(xml(entry("X", "A &amp; B", "ABQ", "2")));
    expect(result.currencies.find((c) => c.code === "ABQ")?.name).toBe("A & B");
  });

  it("rejects conflicting duplicates and files that are not List One", () => {
    expect(() =>
      parseListOne(xml(entry("A", "Euro", "EUR", "2") + entry("B", "Euro", "EUR", "3"))),
    ).toThrow(/Conflicting/);
    expect(() => parseListOne("<html></html>")).toThrow(/Not an ISO 4217/);
  });
});
