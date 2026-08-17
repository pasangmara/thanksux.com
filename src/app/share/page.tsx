import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { StartSignalButton } from "./StartSignalButton";

/**
 * [Phase 6C — ThanksSignal submission system] NOTICE -> SHARE. The entry
 * point for "I noticed a real design/UX friction and want the community
 * to see it" — deliberately calm, not a feed, not a form dumped
 * immediately in front of an anonymous visitor. Auth is enforced here as
 * a real server-side check (redirect to /login), not a hidden button —
 * matching every other protected route in this app since Phase 5.
 */
export default async function SharePage() {
  const current = await getCurrentPublicUser();

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <p className="text-caption text-text-tertiary">NOTICE → SHARE</p>
        <h1 className="text-h1 mt-2">Share a problem</h1>
        <p className="text-body mt-4 max-w-lg text-text-secondary">
          A small, real moment where better design could have helped — a confusing form, a booking flow that lost
          you, a screen that didn&rsquo;t make sense. Share it, and the Thanks UX design community can notice it too.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {current ? (
            <>
              <StartSignalButton />
              <p className="text-caption text-text-secondary">
                Already started one?{" "}
                <Link href="/dashboard" className="text-ink underline hover:text-accent">
                  Continue a draft
                </Link>
              </p>
            </>
          ) : (
            <>
              <Button href="/login?from=/share" variant="primary" className="w-fit">
                Log in to share a problem
              </Button>
              <p className="text-caption text-text-secondary">
                No account yet?{" "}
                <Link href="/signup?from=/share" className="text-ink underline hover:text-accent">
                  Sign up
                </Link>
              </p>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
