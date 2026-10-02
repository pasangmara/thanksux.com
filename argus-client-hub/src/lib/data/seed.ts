import { hashPassword } from "@/lib/auth/password";
import type { Activity, Client, Feedback, OutboxEvent, Service, TeamMember } from "@/lib/domain/types";
import { DEFAULT_SETTINGS } from "./defaults";
import type { AnyRow, TableName } from "./store";

/**
 * SAMPLE DATA for demo mode only. These clients and quotes are made up to
 * show the UI; they are not real ARGUS clients or reviews. The dashboard
 * shows a "Sample data" badge whenever demo mode is on.
 */

export const DEMO_LOGIN = { email: "joy@argus.demo", password: "argus-demo" };

const day = 86_400_000;
const ago = (d: number, h = 10) => new Date(Date.now() - d * day + (h - 10) * 3_600_000).toISOString();
const dateAgo = (d: number) => new Date(Date.now() - d * day).toISOString().slice(0, 10);

let n = 0;
const id = (p: string) => `${p}-${(++n).toString().padStart(4, "0")}-demo`;

function client(c: Partial<Client> & Pick<Client, "name" | "company" | "services" | "status" | "feedback_code">): Client {
  return {
    id: id("cl"),
    whatsapp: null,
    email: null,
    package: null,
    start_date: null,
    end_date: null,
    completed_at: null,
    preferred_language: "en",
    link_status: "not_sent",
    link_sent_at: null,
    link_opened_at: null,
    last_contact_at: null,
    notes: null,
    created_at: ago(40),
    updated_at: ago(2),
    ...c,
  };
}

export function buildSeed(): Record<TableName, AnyRow[]> {
  n = 0;
  const admin: TeamMember = {
    id: id("tm"),
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || DEMO_LOGIN.email,
    name: process.env.ADMIN_NAME?.trim() || "Joy Howlader",
    role: "admin",
    password_hash: hashPassword(process.env.ADMIN_PASSWORD || DEMO_LOGIN.password),
    created_at: ago(60),
    last_login_at: null,
  };

  const rahim = client({
    name: "Rahim Uddin", company: "Nexora Geo", services: ["website"], status: "completed",
    package: "Website · Business", whatsapp: "+880 1711-000001", email: "rahim@nexorageo.example",
    start_date: dateAgo(45), end_date: dateAgo(8), completed_at: ago(8), feedback_code: "nexora-geo-7k2p9x",
    link_status: "submitted", link_sent_at: ago(7), link_opened_at: ago(6), last_contact_at: ago(2),
    notes: "Happy with the launch. Interested in an AI auto-reply add-on next month.",
  });
  const farzana = client({
    name: "Farzana Akter", company: "Lumen Skincare", services: ["brand"], status: "active",
    package: "Brand identity · Standard", whatsapp: "+880 1711-000002", email: "farzana@lumen.example",
    start_date: dateAgo(14), feedback_code: "lumen-skincare-q8w3md", last_contact_at: ago(5), preferred_language: "bn",
  });
  const tanvir = client({
    name: "Tanvir Hasan", company: "Dhaka Prop Hub", services: ["ai_automation"], status: "completed",
    package: "AI Auto-Reply · Messenger", whatsapp: "+880 1711-000003", email: "tanvir@dhakaprophub.example",
    start_date: dateAgo(41), end_date: dateAgo(10), completed_at: ago(10), feedback_code: "dhaka-prop-hub-9x4mtr",
    link_status: "submitted", link_sent_at: ago(9), link_opened_at: ago(4), last_contact_at: ago(0, 9),
    notes: "Prefers WhatsApp voice notes. Wants weekly updates on Thursdays.",
  });
  const nusrat = client({
    name: "Nusrat Jahan", company: "Kraft & Co.", services: ["ads"], status: "completed",
    package: "Ads · 30 days", whatsapp: "+880 1711-000004", start_date: dateAgo(50), end_date: dateAgo(16),
    completed_at: ago(16), feedback_code: "kraft-co-h3vz7p", link_status: "submitted", link_sent_at: ago(15),
    link_opened_at: ago(14), last_contact_at: ago(7),
  });
  const sabbir = client({
    name: "Sabbir Ahmed", company: "Orbit Clinic", services: ["website"], status: "onboarding",
    package: "Website · Business", whatsapp: "+880 1711-000005", email: "sabbir@orbitclinic.example",
    start_date: dateAgo(1), feedback_code: "orbit-clinic-m2k8wd", last_contact_at: ago(1),
  });
  const arif = client({
    name: "Arif Chowdhury", company: "Tidewater Logistics", services: ["website", "ai_automation"], status: "completed",
    package: "Website + AI", whatsapp: "+880 1711-000006", email: "arif@tidewater.example",
    start_date: dateAgo(60), end_date: dateAgo(9), completed_at: ago(9), feedback_code: "tidewater-p7c4nf",
    link_status: "sent", link_sent_at: ago(8), last_contact_at: ago(9),
  });
  const mithila = client({
    name: "Mithila Roy", company: "Shapla Fashion", services: ["content"], status: "paused",
    package: "Content · 12 posts", whatsapp: "+880 1711-000007", start_date: dateAgo(90),
    feedback_code: "shapla-fashion-t5r9ke", link_status: "submitted", link_sent_at: ago(62),
    link_opened_at: ago(61), last_contact_at: ago(21),
  });
  const clients = [rahim, farzana, tanvir, nusrat, sabbir, arif, mithila];

  const fb = (c: Client, f: Partial<Feedback> & Pick<Feedback, "rating" | "ref">): Feedback => ({
    id: id("fb"),
    client_id: c.id,
    feedback_code: c.feedback_code,
    created_at: ago(5),
    client_name: c.name,
    company: c.company,
    services: c.services as Service[],
    communication: null,
    result: null,
    did_well: null,
    do_better: null,
    recommend: null,
    public_permission: false,
    display_mode: null,
    display_name: null,
    photo_file_id: null,
    language: "en",
    follow_up: f.rating <= 3 ? "open" : null,
    post_status: "not_for_post",
    post_link: null,
    posted_at: null,
    updated_at: ago(2),
    ...f,
  });

  const feedback: Feedback[] = [
    fb(mithila, { ref: "FB-0001", rating: 4, communication: 4, result: 4, recommend: "maybe", created_at: ago(61),
      did_well: "Good content and the reels matched our style.", do_better: "One batch was a bit late." }),
    fb(nusrat, { ref: "FB-0002", rating: 4, communication: 5, result: 4, recommend: "yes", created_at: ago(14),
      did_well: "The ads look premium. Messages started coming the first week.", do_better: "We want more reels next time.",
      public_permission: true, display_mode: "first_name", display_name: "Nusrat", post_status: "posted",
      post_link: "https://www.facebook.com/profile.php?id=61594554400256", posted_at: ago(10) }),
    fb(rahim, { ref: "FB-0003", rating: 5, communication: 5, result: 4, recommend: "yes", created_at: ago(6, 20),
      did_well: "Clear communication, and the website went live on the promised date. The Bangla + English pages work well.",
      do_better: "A weekly update on Thursdays would have helped.", public_permission: true,
      display_mode: "name_company", display_name: "Rahim Uddin, Nexora Geo", post_status: "pending" }),
    fb(tanvir, { ref: "FB-0004", rating: 2, communication: 2, result: 3, recommend: "no", created_at: ago(4, 11),
      did_well: "The auto-reply in Bangla works and saves us time at night.",
      do_better: "Replies were slow in week 2. We had to chase updates." }),
  ];

  const act = (c: Client, type: Activity["type"], text: string, at: string, actor: string | null = "Joy Howlader"): Activity => ({
    id: id("ac"), client_id: c.id, type, text, actor, created_at: at,
  });
  const activity: Activity[] = [
    ...clients.map((c) => act(c, "client_created", "Client added", c.created_at)),
    act(rahim, "status_changed", "Status → Completed", ago(8)),
    act(rahim, "link_sent", "Feedback link sent on WhatsApp", ago(7)),
    act(rahim, "feedback_received", "Feedback received · 5★", ago(6, 20), "Client"),
    act(tanvir, "status_changed", "Status → Completed", ago(10)),
    act(tanvir, "link_sent", "Feedback link sent on WhatsApp", ago(9)),
    act(tanvir, "feedback_received", "Feedback received · 2★ · urgent", ago(4, 11), "Client"),
    act(tanvir, "contact_logged", "Call: Joy called Tanvir, will add Thursday updates", ago(0, 9)),
    act(nusrat, "feedback_received", "Feedback received · 4★", ago(14), "Client"),
    act(nusrat, "post_status_changed", "Post → Posted", ago(10)),
    act(arif, "status_changed", "Status → Completed", ago(9)),
    act(arif, "link_sent", "Feedback link sent on WhatsApp", ago(8)),
    act(mithila, "feedback_received", "Feedback received · 4★", ago(61), "Client"),
    act(mithila, "status_changed", "Status → Paused", ago(21)),
  ];

  // n8n is not connected yet: events wait in the outbox (status "pending").
  const outbox: OutboxEvent[] = feedback.slice(1).map((f) => ({
    id: id("ev"),
    event: "feedback.created",
    payload: { ref: f.ref, client: f.client_name, rating: f.rating, sample: true },
    status: "pending",
    attempts: 0,
    last_error: null,
    next_attempt_at: null,
    created_at: f.created_at,
    sent_at: null,
  }));

  return {
    team_members: [admin as unknown as AnyRow],
    sessions: [],
    clients: clients as unknown as AnyRow[],
    feedback: feedback as unknown as AnyRow[],
    activity: activity as unknown as AnyRow[],
    settings: [{ id: "main", data: DEFAULT_SETTINGS, updated_at: ago(1) }],
    outbox: outbox as unknown as AnyRow[],
  };
}
