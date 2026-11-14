import type { Metadata } from "next";
import { AppHeader } from "@/components/shared/app-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/modules/auth/session";
import { ProfileForm } from "@/modules/users/components/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-5 md:px-6 md:py-10">
        <h1 className="text-h1 font-semibold tracking-tight">Profile</h1>
        <Card className="flex flex-col gap-6">
          <ProfileForm displayName={user.displayName} />
          {/* Email is read-only in M1 (ROADMAP D18): shown as text, not a disabled input. */}
          <dl className="flex flex-col gap-1">
            <dt className="text-small font-medium text-fg">Email</dt>
            <dd className="text-body-lg break-all text-fg-secondary">{user.email}</dd>
            <dd className="text-small text-fg-muted">Your email can’t be changed yet.</dd>
          </dl>
        </Card>
      </main>
    </>
  );
}
