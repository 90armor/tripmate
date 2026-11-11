/**
 * ⚠️ DEVELOPMENT / TEST DATA ONLY — NOT the canonical ISO 4217 dataset.
 *
 * CURRENT_TASK §20: an incomplete hand-written list must not be treated as
 * authoritative. This small subset exists only to exercise the seed mechanism and
 * cover each rounding class (0, 2 and 3 minor units). The canonical dataset,
 * sourced from the ISO 4217 maintenance agency with source and date recorded, is a
 * prerequisite for M1 Create Trip and will replace this file.
 */
export const DEV_TEST_CURRENCIES = [
  { code: "JPY", name: "Japanese Yen", symbol: "¥", minorUnits: 0, active: true },
  { code: "USD", name: "US Dollar", symbol: "$", minorUnits: 2, active: true },
  { code: "EUR", name: "Euro", symbol: "€", minorUnits: 2, active: true },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: null, minorUnits: 3, active: true },
] as const;
