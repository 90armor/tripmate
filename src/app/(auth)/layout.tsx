export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10 sm:px-5 md:py-16">
      <p className="text-h3 font-semibold text-action">TripMate</p>
      {children}
    </main>
  );
}
