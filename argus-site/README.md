# ARGUS website

Ek page er marketing site: branding, website, AI chatbot ar ads. Next.js 16 (App Router) diye static export kora, tai je kono hosting e chole.

## Chalano

```bash
cd argus-site
npm install
npm run dev      # http://localhost:3000
npm run build    # out/ folder e puro site toiri hoy
npm run start    # out/ folder local e dekhar jonno
```

Node 20.9 ba tar beshi lagbe.

## Hosting e tola (Hostinger / cPanel / Netlify)

1. `npm run build` chalan.
2. `out/` folder er **bhitorer sob file** hosting er `public_html` (ba site root) e upload korun.
3. Domain onno hole build er age set korun: `NEXT_PUBLIC_SITE_URL=https://yourdomain.com npm run build`. Default `https://argus.agency`. Canonical, sitemap, robots ar schema te ei URL bose.

## Kothay ki bodlaben

| Ki | File |
|---|---|
| Daam, service, kit, rate card, FAQ, payment, WhatsApp number | `src/lib/data.ts` |
| USD rate (1 USD = ৳122.77) | `src/lib/data.ts` → `USD_RATE` |
| Section er lekha ar order | `src/app/page.tsx` |
| Rong, font size, spacing | `src/app/globals.css` (upore `:root` e color token) |
| Title, description, SEO keyword | `src/app/layout.tsx` |
| Photo, logo, video | `public/img`, `public/media` |

## Ja ache

- 16 section: nav, hero, marquee, problem, system, 10 services, kits, rate card, comparison, how it works, demos, founder, guarantees, FAQ, final CTA, footer.
- Protiti daam BDT ar USD eksathe dekhay. Bangladesh er baire theke (time zone dekhe) visitor age USD dekhe. Switch diye bodlano jay.
- Scroll effect: fade-up, sticky step list, timeline fill, marquee, live chat demo. `prefers-reduced-motion` e sob bondho hoy.
- SEO: ekta H1, title/meta, Open Graph image, JSON-LD (Organization, ProfessionalService + Offer, FAQPage), sitemap.xml, robots.txt.
- Demo gulo te "Demo" / "Example" lekha. Kono fake review ba client result nei.
