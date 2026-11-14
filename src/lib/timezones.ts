/*
 * Trip timezone choices (ROADMAP D15): a searchable IANA list, validated
 * against the runtime. One list feeds both the picker and server validation.
 *
 * ICU (Node 24, and some browsers) lists the CLDR-canonical spelling for zones
 * IANA has since renamed — "Asia/Rangoon" instead of "Asia/Yangon". Travelers
 * search for the current name, so known renames are mapped to the current IANA
 * name. Every mapped name is accepted by Intl (unit-tested); a runtime that
 * already lists current names makes the map a no-op.
 */

/** Legacy ICU/CLDR name → current IANA name (IANA "backward" links). */
const CURRENT_IANA_NAMES: Readonly<Record<string, string>> = {
  "Africa/Asmera": "Africa/Asmara",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Catamarca": "America/Argentina/Catamarca",
  "America/Coral_Harbour": "America/Atikokan",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Jujuy": "America/Argentina/Jujuy",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
};

let cachedList: readonly string[] | undefined;
let cachedSet: ReadonlySet<string> | undefined;

/** Sorted, unique IANA timezone names offered for a trip, including "UTC". */
export function listTimeZones(): readonly string[] {
  if (!cachedList) {
    const names = Intl.supportedValuesOf("timeZone").map(
      (zone) => CURRENT_IANA_NAMES[zone] ?? zone,
    );
    cachedList = [...new Set([...names, "UTC"])].sort();
  }
  return cachedList;
}

/** Exact (case-sensitive) membership in listTimeZones(). */
export function isSupportedTimeZone(value: string): boolean {
  cachedSet ??= new Set(listTimeZones());
  return cachedSet.has(value);
}
