import type { Metadata } from "next";
import { Bell, Link2, Lock, MessageCircle, Palette, Sheet, UsersRound, Workflow } from "lucide-react";
import { PageHeader } from "@/components/hub/PageHeader";
import { Card } from "@/components/hub/Section";
import { BrandingForm, ContactForm, IntegrationsForm, NotificationsForm, PasswordForm, ReviewLinksForm, TeamPanel } from "@/components/hub/SettingsForms";
import { Pill } from "@/components/ui/Pill";
import { requireMember } from "@/lib/auth/session";
import { countWaiting, recentEvents } from "@/lib/integrations/outbox";
import { getSettings, n8nConfig, publicBrand } from "@/lib/services/settings";
import { listTeam } from "@/lib/services/team";

export const metadata: Metadata = { title: "Settings" };

function Section({ id, icon, title, desc, aside, children }: { id?: string; icon: React.ReactNode; title: string; desc: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-soft text-mint">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[19px] font-medium text-text">{title}</h2>
          <p className="text-[13px] text-muted">{desc}</p>
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

export default async function SettingsPage() {
  const me = await requireMember();
  const isAdmin = me.role === "admin";
  if (!isAdmin) {
    return (
      <>
        <PageHeader title="Settings" subtitle="Your account" />
        <Section icon={<Lock className="size-5" />} title="My account" desc={`${me.name} · ${me.email} · Staff`}>
          <PasswordForm />
        </Section>
        <p className="text-[13px] text-muted">Integrations, branding and team settings are for admins.</p>
      </>
    );
  }

  const [s, team, recent, waiting] = await Promise.all([getSettings(), listTeam(), recentEvents(15), countWaiting()]);
  const n8n = n8nConfig(s);
  const brand = publicBrand(s);

  return (
    <>
      <PageHeader title="Settings" subtitle="n8n and Google Sheet, notifications, form branding, review links and team" />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Section
            id="integrations"
            icon={<Workflow className="size-5" />}
            title="n8n + Google Sheet"
            desc="Every change is saved here first, then sent to n8n. n8n writes the Sheet row and sends WhatsApp/email."
            aside={<Pill tone={n8n.connected ? "mint" : "neutral"}>{n8n.connected ? "Connected" : "Not connected"}</Pill>}
          >
            <IntegrationsForm
              webhookUrl={s.n8n.webhook_url}
              hasSecret={Boolean(n8n.secret)}
              fromEnv={n8n.fromEnv}
              sheetUrl={s.sheet.url}
              events={s.n8n.events}
              connected={n8n.connected}
              recent={recent}
              waiting={waiting}
            />
          </Section>
          <Section icon={<Bell className="size-5" />} title="Notifications" desc="Who n8n alerts, and for what.">
            <NotificationsForm notify={s.notify} days={s.reminders.days_after_completion} />
          </Section>
        </div>
        <div className="flex flex-col gap-5">
          <Section id="branding" icon={<Palette className="size-5" />} title="Form branding" desc="Your photo and message on the client form and the thank-you page.">
            <BrandingForm
              brand={s.brand}
              photoUrl={brand.photoUrl}
              avatarUrl={brand.avatarUrl}
              customPhotos={Boolean(s.brand.founder_photo_file_id || s.brand.founder_avatar_file_id)}
            />
          </Section>
          <Section icon={<Link2 className="size-5" />} title="Review links" desc="Shown to clients after a 4–5★ rating. Empty = hidden.">
            <ReviewLinksForm facebook={s.review_links.facebook} google={s.review_links.google} />
          </Section>
          <Section icon={<MessageCircle className="size-5" />} title="Public contact" desc="Shown on the 1–3★ and “link not active” pages.">
            <ContactForm whatsapp={s.contact.whatsapp} email={s.contact.email} />
          </Section>
          <Section icon={<UsersRound className="size-5" />} title="Team" desc="People who can sign in to this dashboard.">
            <TeamPanel members={team} me={me} />
          </Section>
          <Section icon={<Lock className="size-5" />} title="My account" desc={`${me.name} · ${me.email}`}>
            <PasswordForm />
          </Section>
        </div>
      </div>
      <p className="flex items-center gap-2 text-[12.5px] text-muted">
        <Sheet className="size-4" /> Sheet columns: Feedback ID · Date · Client · Company · Service · Rating · Communication · Result · Did well · Do better · Recommend · Public permission · Display name · Photo URL · Follow-up · Post status · Post link · Source
      </p>
    </>
  );
}
