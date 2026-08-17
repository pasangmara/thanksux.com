import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { LogoutButton } from "./LogoutButton";

/**
 * [Phase 5] Protected route — a Server Component redirect, not a hidden
 * UI control: an unauthenticated visitor is sent to /login before any
 * profile data is ever fetched or rendered, and every field read here goes
 * through the RLS-bound server client (getCurrentPublicUser), so this page
 * can only ever show the signed-in visitor their own data even if this
 * check were somehow bypassed.
 */
export default async function ProfilePage() {
  const current = await getCurrentPublicUser();
  if (!current) redirect("/login?from=/profile");

  const { profile, email } = current;

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-h1">Your profile</h1>
          <LogoutButton />
        </div>

        <div className="mt-8 flex max-w-md flex-col gap-4 rounded-md border border-border bg-surface p-6">
          <div>
            <p className="text-caption text-text-tertiary">Name</p>
            <p className="text-body text-ink">{profile.name}</p>
          </div>
          <div>
            <p className="text-caption text-text-tertiary">Email</p>
            <p className="text-body text-ink">{email}</p>
          </div>
          {profile.username ? (
            <div>
              <p className="text-caption text-text-tertiary">Username</p>
              <p className="text-body text-ink">@{profile.username}</p>
            </div>
          ) : null}
          {profile.bio ? (
            <div>
              <p className="text-caption text-text-tertiary">Bio</p>
              <p className="text-body text-ink">{profile.bio}</p>
            </div>
          ) : null}
          {profile.website ? (
            <div>
              <p className="text-caption text-text-tertiary">Website</p>
              <p className="text-body text-ink">{profile.website}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <Button href="/settings/account" variant="secondary">
            Edit profile
          </Button>
        </div>
        <p className="text-caption mt-8 text-text-tertiary">
          Registered {new Date(profile.createdAt).toLocaleDateString()}. This is the authentication foundation for
          Thanks UX — community features (
          <Link href="/work" className="underline hover:text-ink">
            problems, contributions, design responses
          </Link>
          ) aren&rsquo;t built yet.
        </p>
      </Container>
    </section>
  );
}
