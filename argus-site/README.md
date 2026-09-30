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

## Facebook (Meta) Pixel

Ad chalanor age Pixel boshan, jate website visit ar WhatsApp click Meta te track hoy:

```bash
NEXT_PUBLIC_META_PIXEL_ID=1234567890 npm run build
```

Tarpor notun `out/` upload korun. Pixel ID na dile kono tracking script load hoy na.

| Event | Kokhon |
|---|---|
| PageView | Page khulle |
| ViewContent | Pricing section screen e ashle (ekbar) |
| Lead | SEE Audit er WhatsApp button click |
| Contact | Onno je kono WhatsApp button click |

## Kothay ki bodlaben

| Ki | File |
|---|---|
| Daam, code, WhatsApp number, Facebook/LinkedIn link | `src/lib/data.ts` (dui bhashar jonno ek jaygay) |
| USD rate (1 USD = ৳122.77) | `src/lib/data.ts` → `USD_RATE` |
| English lekha | `src/lib/content.ts` (`UI_EN`) ar `src/lib/data.ts` |
| বাংলা লেখা | `src/lib/content-bn.ts` |
| Section er order ar layout | `src/components/home.tsx` |
| Rong, font size, spacing, Bangla typography | `src/app/globals.css` (niche `html[lang="bn"]` block) |
| Title, description, SEO keyword (dui bhasha) | `src/lib/metadata.ts` |
| Photo, logo, video, share image | `public/img`, `public/media`, `public/og-image.jpg` |

## Dui bhasha

- English: `/` · বাংলা: `/bn/`. Nav er `EN | বাংলা` diye bodlano jay.
- Dam ekta jaygay (`data.ts`) thake, tai dui page e kokhono alada dam hobe na.
- Bangla page e sob sonkhya Bangla ongke (৳১৬,৫০০), heading e Anek Bangla, lekhay Noto Sans Bengali (duitai OFL license).
- `hreflang`, canonical ar sitemap e dui page i ache.

## Ja ache

- 16 section: nav, hero, marquee, problem, system, 10 services, kits, rate card, comparison, how it works, demos, founder, guarantees, FAQ, final CTA, footer.
- Protiti daam BDT ar USD eksathe dekhay. Kit ar rate card e 3/12 mash prepay dile live dam, save ar total dekhay. Bangladesh er baire theke (time zone dekhe) visitor age USD dekhe. Switch diye bodlano jay.
- Scroll effect: fade-up, sticky step list, timeline fill, marquee, live chat demo. `prefers-reduced-motion` e sob bondho hoy.
- SEO: ekta H1, title/meta, Open Graph image, JSON-LD (Organization, ProfessionalService + Offer, FAQPage), sitemap.xml, robots.txt.
- Demo gulo te "Demo" / "Example" lekha. Kono fake review ba client result nei.
