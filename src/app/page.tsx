import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

/** Entry point: signed-in users go to My Trips, everyone else to Sign In. */
export default async function HomePage() {
  redirect((await getCurrentUser()) ? "/trips" : "/sign-in");
}
