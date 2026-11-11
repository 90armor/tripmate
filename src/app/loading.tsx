export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-5 md:px-6 md:py-12">
      <p role="status" aria-live="polite" className="text-body text-fg-secondary">
        Loading…
      </p>
    </main>
  );
}
