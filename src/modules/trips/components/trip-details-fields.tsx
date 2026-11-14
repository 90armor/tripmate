import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CurrencyOption } from "@/modules/currencies/list-active-currencies";
import { DESTINATION_MAX, TRIP_NAME_MAX, type TripDetailsField } from "../schemas";

type Values = Partial<Record<TripDetailsField, string>>;

/**
 * The trip detail fields shared by Create Trip and Trip Settings. Uncontrolled
 * inputs: `values` (last submission, or the saved trip) are default values, so
 * the form keeps what the traveler typed after a validation error.
 */
export function TripDetailsFields({
  values,
  errors,
  timezones,
  currencies,
}: {
  values: Values;
  errors: Values;
  timezones: readonly string[];
  currencies: readonly CurrencyOption[];
}) {
  return (
    <>
      <Input
        label="Trip name"
        name="name"
        maxLength={TRIP_NAME_MAX}
        placeholder="Tokyo Autumn Trip"
        autoComplete="off"
        required
        defaultValue={values.name}
        error={errors.name}
      />
      <Input
        label="Destination"
        name="destination"
        maxLength={DESTINATION_MAX}
        placeholder="Tokyo, Japan"
        hint="The main place you’re going."
        autoComplete="off"
        required
        defaultValue={values.destination}
        error={errors.destination}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Start date"
          name="startDate"
          type="date"
          required
          defaultValue={values.startDate}
          error={errors.startDate}
        />
        <Input
          label="End date"
          name="endDate"
          type="date"
          required
          defaultValue={values.endDate}
          error={errors.endDate}
        />
      </div>
      {/*
        Searchable IANA list with no default (ROADMAP D15): a native datalist
        filters as you type on phones and desktop; the server accepts only an
        exact name from the same list.
      */}
      <Input
        label="Trip timezone"
        name="timezone"
        list="trip-timezones"
        placeholder="Start typing a city, e.g. Tokyo"
        hint="Trip days and times follow this timezone, wherever you are."
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={values.timezone}
        error={errors.timezone}
      />
      <datalist id="trip-timezones">
        {timezones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
      <Select
        label="Base currency"
        name="baseCurrency"
        hint="Shared costs are totalled and settled in this currency."
        placeholder="Choose a currency"
        required
        options={currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
        defaultValue={values.baseCurrency ?? ""}
        error={errors.baseCurrency}
      />
    </>
  );
}
