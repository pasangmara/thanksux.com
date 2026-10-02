import { EVENT_NAMES, type EventName, type Settings } from "@/lib/domain/types";

export const DEFAULT_SETTINGS: Settings = {
  brand: {
    founder_name: "Joy Howlader",
    founder_role: "Founder, ARGUS",
    founder_photo_file_id: null,
    founder_avatar_file_id: null,
    note_en: "Thank you for trusting ARGUS. One honest minute from you helps us get better.",
    note_bn: "ARGUS-এর ওপর ভরসা রাখার জন্য ধন্যবাদ। আপনার ১ মিনিটের সৎ মতামত আমাদের আরও ভালো করে।",
    thanks_en: "Your feedback reached me and the ARGUS team. It truly means a lot. See you on the next project!",
    thanks_bn: "আপনার মতামত আমার আর ARGUS টিমের কাছে পৌঁছে গেছে। এটা আমাদের কাছে অনেক মূল্যবান। পরের প্রজেক্টে আবার দেখা হবে!",
  },
  contact: {
    whatsapp: "+880 1303-364567",
    email: "neonemiami@gmail.com",
  },
  review_links: {
    facebook: "https://www.facebook.com/profile.php?id=61594554400256",
    google: "",
  },
  notify: {
    whatsapp: "+880 1303-364567",
    email: "neonemiami@gmail.com",
    new_feedback: true,
    low_rating: true,
    daily_reminder: true,
    post_status: false,
  },
  sheet: { url: "" },
  n8n: {
    webhook_url: "",
    secret: "",
    events: Object.fromEntries(EVENT_NAMES.map((e) => [e, true])) as Record<EventName, boolean>,
  },
  reminders: { days_after_completion: 3 },
};

/** Deep-merge saved settings over defaults so new keys added later always exist. */
export function withDefaults(saved: Partial<Settings> | null | undefined): Settings {
  const s = saved ?? {};
  return {
    brand: { ...DEFAULT_SETTINGS.brand, ...s.brand },
    contact: { ...DEFAULT_SETTINGS.contact, ...s.contact },
    review_links: { ...DEFAULT_SETTINGS.review_links, ...s.review_links },
    notify: { ...DEFAULT_SETTINGS.notify, ...s.notify },
    sheet: { ...DEFAULT_SETTINGS.sheet, ...s.sheet },
    n8n: {
      ...DEFAULT_SETTINGS.n8n,
      ...s.n8n,
      events: { ...DEFAULT_SETTINGS.n8n.events, ...s.n8n?.events },
    },
    reminders: { ...DEFAULT_SETTINGS.reminders, ...s.reminders },
  };
}
