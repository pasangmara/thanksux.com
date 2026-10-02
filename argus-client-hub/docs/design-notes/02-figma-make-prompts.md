# ARGUS Client Feedback: Figma Make prompt ar live korar step

Ami Figma Make ba Figma Sites nijer theke chalate pari na. Amar kache shudhu Figma Design file e kaj korar tool ache.

Tai neeche prottek ta prompt ready kore diyechi. Apni Figma Make e serial onujayi paste korben. Prottek prompt er por preview check korben, tarpor porer ta din.

---

## Step 0: Shuru korar age (5 minute)

1. **Figma Make** e notun file khulun. Naam din `ARGUS Client Hub`.
2. **Chobi attach korun** (Make er chat box e drag kore din):
   - `argus-logo.png`: ARGUS logo, transparent.
   - `joy-thank-you.jpg`: apnar thank-you chobi (hashi mukh, 1200×1200 ba boro, mukh dan dike).
   - Chaile `joy-portrait.jpg`: choto gol chobi er jonno.
3. **Design reference attach korun:**
   - Main ARGUS file e page **30 — CLIENT FEEDBACK · FORM** e jan.
   - `M1`, `M3`, `M5`, `D1` frame select kore Copy (Ctrl/Cmd + C) korun.
   - Make er chat e Paste korun.
   - Page **31** theke `DB2 · Overview`, `DB3 · Clients`, `DB6 · Feedback + detail drawer`, `DB7 · Settings` o ekivabe paste korun.
   - Make er "attach design / paste frame" option ta apnar account e na thakle, oi frame gulo PNG export kore image hishebe din.

---

## Prompt 1: Design system + client feedback form

```
Build a web app called "ARGUS Client Hub" for ARGUS, a brand + website + AI automation studio in Bangladesh.
It has two parts: a public client feedback form, and a private dashboard for the ARGUS team.
In this step build ONLY the design system and the public feedback form. Match the attached Figma frames closely.

DESIGN SYSTEM (dark, premium, same as argusofficial.com)
- Colors:
  - bg #0B0D0C, bg-2 #131614
  - surface #171A18, surface-2 #1E2321
  - border #2A2F2C, border-strong #3A413D
  - text #F7F7F2, text-2 #C9CFCB, muted #7F8984
  - accent mint #2BF2A1, accent-hover #0FD888, accent-soft #10261D, on-accent #06110C
  - warning #F59E0B / soft #2A2210, error #EF4444 / soft #2B1614, info #3EA6FF / soft #0F1E2A
- Fonts:
  - headings: Space Grotesk (Bold/Medium)
  - body: Geist
  - small labels: Geist Mono, uppercase, letter-spaced
  - Bangla: Noto Sans Bengali
- Radius: 12 for inputs, 16 for cards, pill for chips and buttons.
- Mint is used sparingly: primary buttons, stars, selected states, small labels.

PREMIUM BRAND BACKDROP (behind every form screen)
- Near-black background.
- A soft mint glow (blurred circle, about 12% opacity) at the top right.
- A deep green glow (#0B5E4E, about 35%) at the bottom left.
- A faint dot grid at the top that fades out.
- A very large ARGUS symbol watermark (from the attached logo, about 7% opacity) at the bottom right.
- A thin mint gradient hairline at the very top.
- Cards are solid surfaces on top of this backdrop.

ROUTE: /feedback/:code
The code is a personal link per client, e.g. /feedback/nexora-geo-7k2p.
For now use mock data: client "Rahim Uddin", company "Nexora Geo", service "Website", project "Website Design & Development", completed "24 Sep 2026".

FORM LAYOUT
- Mobile first: 390px wide, 24px side padding.
- Desktop (≥1024px):
  - left column (480px) with the intro, founder note and project card;
  - right column with the form in a card.

Form content, top to bottom:
1. Top bar: ARGUS logo (left) and a language switch pill "EN | বাংলা" (right). The switch changes ALL text instantly.
2. Label "CLIENT FEEDBACK" (mint, mono). Title "How did we do, Rahim?". Text "Your feedback on our work for Nexora Geo. It takes under a minute."
3. FOUNDER NOTE card:
   - round photo of Joy (attached joy-portrait / joy-thank-you, cropped to face, mint ring);
   - quote: "Thank you for trusting ARGUS. One honest minute from you helps us get better.";
   - "— Joy Howlader, Founder" in mint;
   - soft green gradient background and a thin mint border.
4. Project card: "PROJECT" label, project name, "Nexora Geo · Completed 24 Sep 2026", and a selected chip with the service ("Pre-filled by ARGUS").
5. "Overall, how was working with ARGUS?" plus a small "Required" pill. 5 large star buttons (40px), with "Poor" and "Excellent" under them. This is the ONLY required field.
6. A card with two rows: "Communication" and "Result & quality", each with 5 smaller stars (optional).
7. Textarea "What did we do well?" (optional).
8. Textarea "What could we do better?" (optional).
9. "Would you recommend ARGUS to a friend?" with chips Yes / Maybe / No.
10. Divider. Checkbox, OFF by default: "ARGUS can share my feedback publicly (website, Facebook)."
    When checked, show:
    - "How should we show your name?" with radio cards:
      - "Name + company" (Rahim Uddin, Nexora Geo)
      - "First name only" (Rahim)
      - "Anonymous" ("A client of ARGUS")
    - Optional upload: "Add photo or logo", PNG/JPG up to 5 MB, with a preview and Remove.
11. Full-width mint button "Send feedback". It is disabled until a rating is chosen, with the hint "Choose a rating to send".
    While sending, show a spinner, "Sending…", and dim the form.
12. Footer: "Only the ARGUS team sees this unless you allow sharing." and "argusofficial.com".

AFTER SUBMIT
- Rating 4–5 → THANK YOU page:
  - A large founder photo card at the top (attached joy-thank-you.jpg):
    - rounded corners and a thin mint border;
    - a dark fade at the bottom;
    - a "FROM THE FOUNDER" tag top-left;
    - "Joy Howlader / Founder, ARGUS" bottom-left;
    - the ARGUS symbol bottom-right.
  - Title "Thank you, Rahim!".
  - Text "Your feedback reached me and the ARGUS team. It truly means a lot. See you on the next project!"
  - "— Joy Howlader, Founder" in mint.
  - A summary card: the stars, the service, and "Shared publicly as …" if permission was given.
  - "Got one more minute? A public review helps other businesses find us. Totally optional." with outline buttons "Review ARGUS on Facebook" and "Review ARGUS on Google". Hide the Google button if no link is set.
  - Desktop: photo card on the left (about 460px), text on the right.
- Rating 1–3 → page "Thank you for being honest.":
  - "We’re sorry it wasn’t better. Joy will contact you within 24 hours to make it right."
  - A card with Joy's round photo, "Joy Howlader, Founder, ARGUS", a mint button "WhatsApp +880 1303-364567" (link wa.me/8801303364567) and "Email neonemiami@gmail.com" (mailto).
  - No review request on this page.
- Unknown or used code → page "This link isn’t active":
  - "It may have expired, already been used, or been copied wrong. Message us and we’ll send you a new one."
  - WhatsApp and Email buttons.

BANGLA COPY (when বাংলা is on)
- Title: "আমাদের কাজ কেমন লাগলো, রহিম?"
- Founder note: "ARGUS-এর ওপর ভরসা রাখার জন্য ধন্যবাদ। আপনার ১ মিনিটের সৎ মতামত আমাদের আরও ভালো করে।" and "— জয় হাওলাদার, ফাউন্ডার"
- Overall: "ARGUS-এর সাথে কাজের অভিজ্ঞতা সব মিলিয়ে কেমন ছিল?"
- Poor / Excellent: "খারাপ / অসাধারণ"
- Communication: "যোগাযোগ". Result & quality: "কাজের ফলাফল ও মান"
- Did well: "আমরা কোন কাজটা ভালো করেছি?". Do better: "কোথায় আরও ভালো করতে পারতাম?"
- Placeholder: "এখানে লিখুন (ঐচ্ছিক)"
- Recommend: "বন্ধুকে কি ARGUS-এর কথা বলবেন?" with "হ্যাঁ / হয়তো / না"
- Permission: "ARGUS আমার মতামত পাবলিকলি শেয়ার করতে পারবে (ওয়েবসাইট, ফেসবুক)।"
- Name question: "আপনার নাম কীভাবে দেখাবো?" with "নাম + কোম্পানি / শুধু প্রথম নাম / নাম ছাড়া"
- Button: "মতামত পাঠান". Hint: "পাঠাতে একটি রেটিং দিন"
- Footer: "আপনি অনুমতি না দিলে শুধু ARGUS টিম এটা দেখবে।"

RULES
- Accessible: real buttons, labels on inputs, visible focus ring (mint, 4px soft glow), 44px touch targets.
- No fake reviews, no fake numbers, no countdowns.
```

---

## Prompt 2: Dashboard (internal)

```
Now add the private ARGUS team dashboard at /app. Match the attached DB frames.
Same dark design system and colors. Desktop first (1440), and it should also work on a tablet.

LAYOUT
- Left sidebar, 248px, bg #131614:
  - ARGUS logo, then the label "CLIENT HUB";
  - nav: Overview, Clients, Feedback (with a count badge of new items), Settings;
  - at the bottom: a small card "n8n connected · Sheet synced 2 min ago", then the user (avatar "JH", Joy Howlader, Admin).
- The active nav item has a mint-soft background and a mint icon.
- Main area: 40px padding, page title (Space Grotesk 32) and a subtitle.

PAGES
1. /app/login: centered card, "CLIENT HUB · Sign in · For the ARGUS team only", email + password, mint "Sign in" button.
2. /app (Overview):
   - 4 KPI cards: Active clients, Feedback received, Average rating, Posts pending.
   - "Needs attention" list, each row with a status pill and an action button:
     - 1–3★ feedback with follow-up open → "WhatsApp";
     - completed project with no feedback after 7 days → "Send reminder";
     - feedback link not sent → "Copy link".
   - "Recent feedback": the last 5, with stars and a short quote.
3. /app/clients:
   - search, plus status filter chips (All / Onboarding / Active / Completed / Paused with counts);
   - table columns: Client (avatar + name + company), Service, Status pill, Last feedback (small stars + date), Last contact, Feedback link (icon buttons Copy / WhatsApp / Email).
   - WhatsApp opens wa.me with a ready message and the client's personal link: "Hi {first name}, thanks for working with ARGUS! Could you share 1 minute of feedback? {link} — Joy".
   - "Add client" (mint) opens a modal:
     - name, company, WhatsApp, email;
     - services as multi-select chips (Brand identity, Website, AI Automation, Ads, Content);
     - project / package, status, start date, end date;
     - Cancel / Save client.
     - Note: "A personal feedback link is created automatically."
4. /app/clients/:id:
   - breadcrumb, avatar, name, status pill;
   - buttons WhatsApp / Email / Call / Edit;
   - left: Details card, Feedback link card (copy / send, and "sent · opened · answered" status), Private notes (team only);
   - right: Feedback history (stars, follow-up and post pills, answers, "Mark follow-up done") and a Timeline (link sent, feedback received, project completed, client added, calls).
5. /app/feedback:
   - filters: search, Client, Rating, Service, Post status;
   - table columns: Date, Client, Service, Rating, Recommend, Permission pill (Public / Private), Follow-up pill (only for 1–3★: Open / Done), Post pill (Not for post / Pending / Posted).
   - Clicking a row opens a right drawer (480px) with:
     - all ratings and answers, Recommend, and public permission with the display name and logo;
     - "Post status" segmented control: Not for post / Pending / Posted.
       It is LOCKED to "Not for post" when the client did not give permission.
     - A "Post link" input (required when Posted).
     - Note: "Saving updates this row in the Google Sheet."
     - Buttons "Copy quote for post" and "Save".
   - Header button "Open Google Sheet".
6. /app/settings, cards:
   - Google Sheet: link, Open, last row.
   - n8n: Connected / Error pill, masked webhook, last event, 3 workflows with on/off toggles (feedback.created, post.status_changed, Daily 10:00 reminder), "Send test event".
   - Notifications:
     - WhatsApp +880 1303-364567 and email neonemiami@gmail.com (both editable);
     - toggles: New feedback, Low rating (1–3★) urgent, Daily reminder.
   - Review links: Facebook https://www.facebook.com/profile.php?id=61594554400256, and Google (empty, with "Add link").
   - FORM BRANDING:
     - upload / change the founder thank-you photo and the round note photo, with a live preview of both;
     - edit the founder message in English and Bangla.
     - These are used on the public form and the thank-you page.
   - Team: list with Admin / Staff roles and "Invite member". Staff cannot open Settings.

STATUS COLORS
- Onboarding = info
- Active = mint
- Completed = neutral
- Paused = warning
- Pending = warning
- Posted = mint
- Follow-up Open = error

Show a small "Sample data" pill next to page titles while mock data is used, and remove it when real data is connected.
```

---

## Prompt 3: Real data (Supabase) + n8n

Figma Make e Supabase connect korar option ache. Prompt dewar age Make er Supabase button diye connect korun.

```
Connect the app to Supabase and make it real. Keep all secrets on the server (Supabase Edge Functions). Never put keys in the browser code.

TABLES
- clients:
  - id, name, company, whatsapp, email, services text[], package, status (onboarding|active|completed|paused), start_date, end_date
  - feedback_code (unique, random, 4–6 chars after a slug), link_sent_at, last_contact_at, notes, created_at
- feedback:
  - id, ref (FB-0001…), client_id, created_at
  - rating 1–5 (required), communication 1–5, result 1–5, did_well, do_better
  - recommend (yes|maybe|no), public_permission bool, display_mode (name_company|first_name|anonymous), photo_url, language (en|bn)
  - follow_up (open|done|null), post_status (not_for_post|pending|posted), post_link
- activity: id, client_id, type, text, created_at
- settings (one row):
  - sheet_url, notify_whatsapp, notify_email
  - facebook_review_url, google_review_url
  - founder_photo_url, founder_avatar_url, founder_message_en, founder_message_bn
  - toggles

RULES
- Public form:
  - Only an Edge Function "submit-feedback" may read one client by code (name, company, service, project) and insert ONE feedback row.
  - Rate-limit it. After it is used, the code shows "This link isn’t active".
  - Rating 1–3 sets follow_up=open. No public permission forces post_status=not_for_post.
- Dashboard: Supabase Auth email login. Only team members can read or write. Staff cannot change settings.
- Uploads: the client photo/logo goes to a storage bucket "feedback-photos" (5 MB max, PNG/JPG). Founder photos go to the bucket "brand".

N8N
After a feedback is saved, the Edge Function POSTs to the secret N8N_WEBHOOK_URL with header X-ARGUS-Signature (HMAC of the body with N8N_WEBHOOK_SECRET).

Body:
{ "event": "feedback.created", "feedback_id", "ref", "date", "client", "company", "service", "rating", "communication", "result", "did_well", "do_better", "recommend", "public_permission", "display_name", "photo_url", "follow_up", "post_status", "post_link", "source": "personal_link", "urgent": rating <= 3 }

When post status changes, send { "event": "post.status_changed", "feedback_id", "ref", "post_status", "post_link" }.

If n8n fails, keep the feedback (the database is the source of truth), mark it "sync failed" and retry. Show the n8n status on Settings and in the sidebar.

Replace the mock data with real data, and remove the "Sample data" pills.
```

---

## Prompt 4: Final check

```
Do a final QA pass:
- Test mobile 390, tablet 768 and desktop 1440.
- Check the EN/বাংলা switch on every form state.
- Run keyboard-only through the form.
- Check every empty state ("No clients yet — Add your first client", "No feedback yet").
- Check every error state (network error on submit with a Retry button, upload too large).
- Make sure no API key is visible in the browser bundle.
Fix anything broken.
```

---

## Live kora (publish apni korben)

**Figma Make theke (shobcheye shohoj):**
1. Make file er upore dan dike **Publish** e click korun.
2. Ekta `…figma.site` link pabe, sheta preview kore dekhun.
3. Nijer domain lagate chaile Publish → **Custom domain** e jaan, ar `feedback.argusofficial.com` (ba `app.argusofficial.com`) din. Tarpor apnar domain er DNS e Figma jei record dibe sheta boshan. Custom domain er jonno Figma er paid plan lage.

**Figma Sites e rakhte chaile:**
- Make app er nijer link ei live hoye jay, tai alada Sites file lagbe na.
- Jodi argusofficial.com er moto ekta Figma Site e rakhte chan, Sites file e Make er app ta embed/code layer hishebe add korun. Shudhu jodi apnar plan e oi option dekhay.
- Tarpor Sites theke Publish korun.

**Publish er age 3 ta jinish check korben:**
1. Dashboard e login chara kichu dekha jay na. Incognito te `/app` khule dekhben.
2. Sample data ar "Sample data" tag muchhe geche.
3. Ekta test feedback dile Google Sheet e row ashe, ar WhatsApp + email e notification ashe.

---

## Chobi kothay bodlaben

| Kothay | Kibhabe |
|---|---|
| **Figma design** (page 30) | `Feedback · Components` → `FB / Founder photo` → `Photo · replace image here` layer select → Fill → image bodlan. Shob screen e auto bodle jabe. |
| **Live app** | Dashboard → Settings → **Form branding** → Change photo / Edit message. |
