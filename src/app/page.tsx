import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <header className="flex flex-col gap-2">
        <p className="text-small font-medium text-fg-secondary">Foundation preview</p>
        <h1 className="text-h1 font-semibold tracking-tight md:text-display">TripMate</h1>
        <p className="text-body-lg text-fg-secondary">
          Plan together. Travel smoothly. Settle easily.
        </p>
      </header>

      <Card aria-labelledby="component-preview-heading" className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="component-preview-heading" className="text-h3 font-semibold">
              Component preview
            </h2>
            <p className="text-small text-fg-secondary">
              Preview only — these controls don’t save anything yet.
            </p>
          </div>
          <IconButton icon={Ellipsis} label="More options (preview)" />
        </div>

        <Input
          label="Trip name"
          name="preview-trip-name"
          placeholder="Tokyo with friends"
          hint="Shown to everyone on the trip."
        />
        <Textarea label="Notes" name="preview-notes" />

        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>
    </main>
  );
}
