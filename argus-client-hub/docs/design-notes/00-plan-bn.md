# ARGUS Client Feedback & Relationship — plan

**Ki:** ARGUS er nijer client der jonno (jader amra brand, website, AI automation ba ads er service dei) ekta chhoto feedback form ar ekta internal dashboard.

**Keno:**
- Service shesh hole client er feedback newa.
- Client er sathe porer relationship dhore rakha.
- Bhalo feedback testimonial hishebe post kora, ar sheta post hoyeche kina track kora.

**Ja thakbe na:** customer er customer (restaurant guest ityadi), creative template, creative editor, social publishing setting.

---

## 1. Ke ki korbe

| Ke | Login | Ki kore |
|---|---|---|
| **ARGUS team** (Joy + team) | Haan | Client add/edit, feedback link pathano, feedback dekha, post status update |
| **ARGUS client** (jemon Nexora Geo) | **Na** | Nijer personal link khule 1 minute e feedback dey |

---

## 2. Shompurno flow

```
ARGUS dashboard e client add
   → client er personal feedback link toiri hoy (auto)
   → WhatsApp / email e link pathano (dashboard theke 1 click)
   → client form puron kore
   → app database e save hoy (main record)
   → n8n webhook
        → Google Sheet e notun row (auto)
        → ARGUS ke WhatsApp/email notification
        → rating 1–3 hole "urgent" notification
   → dashboard e feedback dekha jay
   → permission thakle "Post: Pending" → post korle "Posted" + post link
        → n8n Sheet er oi row update kore
```

**Google Sheet** hobe operations er sheet: shob feedback auto ashbe, team ekhane dekhte/filter korte parbe.
**Main database** app er nijer (Supabase).

Keno Sheet ke main database banacchi na:
- Public form theke sorasori Sheet e likhle Google er access key public hoye jay, ta nirapod na.
- n8n fail korle data harano jabe na, kaaron age database e save hoy, tarpor n8n abar retry korbe.

---

## 3. Feedback form (shompurno ARGUS branding)

- **Link:** `argusofficial.com/feedback/nexora-geo-7k2p`
- Protita client er alada link. Client er naam, company ar service auto bhora thake.
- Login nei. Link e ekta random code ache, tai onno keu guess kore khulte parbe na.
- **Design:** website er moto, mane kalo base, mint accent, ARGUS logo, Space Grotesk / Geist font. English + বাংলা toggle thakbe (website er motoi).
- **Shomoy:** 1 minute er kom.

| # | Field | Required? |
|---|---|---|
| 1 | Overall rating ★1–5 | **Haan** (shudhu eta-i required) |
| 2 | Kon service niyechilen: auto-selected chip (Brand / Website / AI Automation / Ads / Content) | Pre-filled |
| 3 | 2 ta quick score: **Communication** ★, **Result / Quality** ★ | Optional |
| 4 | "What did we do well?" | Optional |
| 5 | "What could we do better?" | Optional |
| 6 | "Would you recommend ARGUS?" Yes / Maybe / No | Optional |
| 7 | ☐ ARGUS amar feedback public e share korte parbe | Optional, default **off** |
| 8 | (7 tick dile) Kivabe naam dekhabe: Naam + company / Shudhu first name / Anonymous. Chaile photo ba logo upload. | Optional |

**Submit er por:**
- **4–5★:** "Thank you" message, ar optional button "Review ARGUS on Facebook / Google".
- **1–3★:** "Thank you — Joy will contact you within 24 hours." Kono review chaoa hobe na.
- **Link bhul ba bondho hole:** "This link isn't active" + WhatsApp number.

---

## 4. Dashboard (internal, login lagbe)

**Menu:** Overview · Clients · Feedback · Settings (mot 4 ta, er beshi na)

### Overview
- KPI:
  - Active clients
  - Feedback received
  - Average rating
  - **Posts pending**
- **Needs attention:**
  - 1–3★ feedback (follow-up baki)
  - Project shesh, kintu 7 din e feedback ashe ni
  - Link pathano hoy ni
- Recent feedback (5 ta)

### Clients
- **List:** naam, company, service, status, last feedback (rating), last contact.
- **Add client** (chhoto modal):
  - naam, company, phone/WhatsApp, email
  - service (multi-select)
  - project / package
  - start date, end date
  - status
- **Status:** Onboarding · Active · Completed · Paused
- Protita row e **Feedback link**: Copy · WhatsApp e pathao · Email e pathao.

### Client detail
- Info ar contact button (WhatsApp / Email / Call)
- Feedback history
- Private notes
- Chhoto activity timeline: link pathano, feedback esheche, post hoyeche

### Feedback
- **List + filter:** client, rating, service, post status.
- **Detail drawer:** shob answer, permission ki, display name.
- **Post status:** Not for post · **Pending** · **Posted** (post link shoho)
  - Permission na thakle post status lock thakbe.
- **Follow-up:** Open · Done (shudhu 1–3★ er jonno)

### Settings
- Google Sheet link (open button)
- n8n connection status: Connected / Error, ar last sync er shomoy
- Notification kar kache jabe (WhatsApp number, email)
- Team member (admin / staff)

---

## 5. Google Sheet columns

`Feedback ID · Date · Client · Company · Service · Rating · Communication · Result · Did well · Do better · Recommend · Public permission · Display name · Photo URL · Follow-up · Post status · Post link · Link source`

---

## 6. n8n workflow

| # | Trigger | Kaj |
|---|---|---|
| 1 | `feedback.created` (webhook) | Sheet e row add → ARGUS ke WhatsApp/email → rating ≤3 hole "⚠ urgent" |
| 2 | `post.status_changed` | Sheet er oi row er Post status / Post link update |
| 3 | (Optional) protidin shokal 10 ta | Je client er project 3 din age shesh hoyeche kintu feedback ashe ni, tader reminder (ARGUS ke, ba client ke WhatsApp) |

---

## 7. Gurutto purno 4 ta jinish jog korechi (beshi na)

1. **Personal link:** ke feedback dilo seta auto jana jay, client ke kichu type korte hoy na.
2. **Public permission + naam kivabe dekhabe:** permission chhara post kora jabe na.
3. **Low rating alert + follow-up status:** kharap feedback er sathe sathe team jante pare.
4. **Post status + post link:** Pending / Posted ek jaygay dekha jay.

---

## 8. Figma: main ARGUS file e (alada file na)

Notun page 3 ta:

| Page | Ki thakbe |
|---|---|
| **29 — CLIENT FEEDBACK · PLAN** | Ei flow (client → form → DB → n8n → Sheet → notification → dashboard), sitemap, Sheet columns |
| **30 — CLIENT FEEDBACK · FORM** | Mobile 390 + desktop 1440. State: form, rating dewa, submitting, success 4–5★, success 1–3★, invalid link. EN + BN. |
| **31 — CLIENT FEEDBACK · DASHBOARD** | Login, Overview, Clients, Add client modal, Client detail, Feedback list + drawer, Settings. Shathe dashboard er component (status pill, table row, sidebar). |

**Reuse korbo:** ARGUS logo, mint/kalo rong, Space Grotesk / Geist / Geist Mono, circuit line, icon style. Ja ache 02 — LOGO, 04 — COLOR, 07 — COMPONENTS ar website page e.

---

## 9. Code: kothay hobe

- **Form:** `argusofficial.com/feedback/[code]`
- **Dashboard:** `app.argusofficial.com`
- **Stack:** ek-i Next.js app + Supabase. Existing project theke ja reuse hobe:
  - admin login system
  - rate limit
  - n8n webhook code
- Website ta ekhon static, tai form ar dashboard alada server-wala app e cholbe. Website er design ar font hubohu thakbe.
- **Nirapotta:**
  - Public form shudhu nijer link er client er form dekhte ar ekta feedback jama dite pare.
  - Dashboard, Sheet ar n8n key kono public page theke paoa jabe na.

---

## 10. Apnar kach theke 3 ta shiddhanto (default ami dhore nicchi)

| Proshno | Amar suggestion |
|---|---|
| Dashboard er theme | **Website er moto dark.** Brand ek rokom thakbe. Chaile light o kora jay. |
| Form er bhasha | **English + বাংলা toggle** |
| Notification | **WhatsApp + email duitai** (n8n diye) |

Plan thik thakle bolun, tarpor main ARGUS Figma file e page 29–31 design shuru korbo.
