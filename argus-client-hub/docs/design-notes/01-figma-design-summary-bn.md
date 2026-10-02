# ARGUS Client Feedback: Figma design summary

**File:** main ARGUS Figma file. Kono kichu delete kora hoyni.

**Theme:** dark, website er moto (ARGUS / Colors → Dark mode). Logo, mint accent, Space Grotesk / Geist / Geist Mono. Bangla er jonno Noto Sans Bengali (website er moto font).

**Sample data:** screen e jei client naam ache (Rahim Uddin / Nexora Geo, Tanvir Hasan ityadi), segulo shudhu design er jonno. Protiti dashboard screen e "Sample data" tag lagano ache.

---

## Page 29: CLIENT FEEDBACK · PLAN
[Open](https://www.figma.com/design/wEcJm3VFUolyO5kO8n7Itd?node-id=292-49)

- Flow:
  - ARGUS client add kore → link pathay → client form puron kore → database → n8n.
  - n8n theke Sheet row, WhatsApp + email ar ≤3★ hole urgent alert.
  - Tarpor Dashboard → permission → Post: Pending → Posted + link → n8n Sheet update kore.
- Ja banano hobe: form, dashboard ar decision.
- Google Sheet er 18 ta column.
- n8n er 3 ta workflow.

## Page 30: CLIENT FEEDBACK · FORM
[Open](https://www.figma.com/design/wEcJm3VFUolyO5kO8n7Itd?node-id=292-50)

**Component:**

| Component | Variant |
|---|---|
| Lang switch | EN / বাংলা |
| Star | — |
| Rating | L / M / S, 0–5 |
| Chip | — |
| Field | Text / Area × Default / Focus / Filled |
| Checkbox | — |
| Option | display name er jonno |
| Upload | photo / logo |

Button er jonno ARGUS / Button reuse kora hoyeche.

**Screen:**

| # | Screen |
|---|---|
| M1 | Form, English (khali; rating na dile button disabled) |
| M2 | Form, বাংলা |
| M3 | Form puron kora + public permission + naam kivabe dekhabe + logo |
| M4 | Submitting ("Sending…") |
| M5 | Thank you, 4–5★: Facebook / Google review button (optional) |
| M6 | Thank you, 1–3★: "Joy will contact you within 24 hours" + WhatsApp / email |
| M7 | Link not active + WhatsApp / email |
| D1 | Desktop 1440 form (bame intro, dane form card) |
| D2 | Desktop 1440 thank you |

## Page 31: CLIENT FEEDBACK · DASHBOARD
[Open](https://www.figma.com/design/wEcJm3VFUolyO5kO8n7Itd?node-id=292-51)

**Component:**
- Icon set (20px)
- Pill: 5 ta tone
- Toggle
- Button (36px)
- Icon button
- Avatar
- Nav item
- KPI
- Sidebar (4 ta active state)
- Client row
- Feedback row
- Status mapping:

| Kon status | Value |
|---|---|
| Client status | Onboarding / Active / Completed / Paused |
| Post status | Not for post / Pending / Posted |
| Follow-up | Open / Done |
| Permission | Public / Private |
| Integration | Connected / Error |

**Screen:**

| # | Screen |
|---|---|
| DB1 | Login (shudhu ARGUS team) |
| DB2 | Overview: 4 ta KPI, Needs attention (1–3★ follow-up, feedback ashe ni, link pathano hoy ni), Recent feedback |
| DB3 | Clients: search, status filter, table, protita row e link Copy / WhatsApp / Email |
| DB4 | Add client modal: naam, company, WhatsApp, email, service, package, status, date |
| DB5 | Client detail: details, feedback link, private notes, feedback history, timeline |
| DB6 | Feedback list + detail drawer: shob answer, permission, Post status (Not for post / Pending / Posted) + post link, Save → Sheet update |
| DB7 | Settings: Google Sheet, n8n (webhook, 3 ta workflow on/off, test event), notification (WhatsApp + email), review link, team |

---

## Next step (apnar approval er por)

Code e build kora hobe:
- Next.js + Supabase
- Form: `argusofficial.com/feedback/[code]`
- Dashboard: `app.argusofficial.com`
- n8n webhook theke Google Sheet + WhatsApp/email

**Apnar kach theke lagbe:**
1. Google review link (thakle).
2. n8n kothay cholbe (cloud na nijer server).
3. WhatsApp notification kon tool diye jabe (WhatsApp Cloud API / Twilio / onno kichu).
