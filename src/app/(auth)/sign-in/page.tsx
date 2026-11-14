import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/modules/auth/components/sign-in-form";
import { safeRedirectPath } from "@/modules/auth/safe-redirect";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeRedirectPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-semibold tracking-tight">Sign in</h1>
        <p className="text-body-lg text-fg-secondary">Welcome back. Your trips are waiting.</p>
      </header>
      <SignInForm next={next} />
      <p className="text-body text-fg-secondary">
        New to TripMate?{" "}
        <Link
          href={`/sign-up?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center font-medium text-action underline underline-offset-4 hover:text-action-hover"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
