import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/modules/auth/components/sign-up-form";
import { safeRedirectPath } from "@/modules/auth/safe-redirect";
import { getCurrentUser } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeRedirectPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-semibold tracking-tight">Create your account</h1>
        <p className="text-body-lg text-fg-secondary">
          Plan together. Travel smoothly. Settle easily.
        </p>
      </header>
      <SignUpForm next={next} />
      <p className="text-body text-fg-secondary">
        Already have an account?{" "}
        <Link
          href={`/sign-in?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center font-medium text-action underline underline-offset-4 hover:text-action-hover"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
