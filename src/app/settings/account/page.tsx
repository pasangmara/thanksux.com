import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { AccountForm } from "./AccountForm";

export default async function AccountSettingsPage() {
  const current = await getCurrentPublicUser();
  if (!current) redirect("/login?from=/settings/account");

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <h1 className="text-h1">Account settings</h1>
        <p className="text-body mt-2 text-text-secondary">Update the profile visible on Thanks UX.</p>
        <div className="mt-8 max-w-sm">
          <AccountForm profile={current.profile} />
        </div>
      </Container>
    </section>
  );
}
