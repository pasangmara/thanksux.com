# Joy er jonno: shohoj guide (Banglish)

## Eta ki?
- **Client feedback form:** protita client er nijer link. Client 1 minute e rating dey. English/বাংলা dutoi ache. Upore apnar chobi ar message thake, thank-you page e apnar boro chobi.
- **Dashboard:** client add kora, link pathano (WhatsApp/email 1 click e), feedback dekha, follow-up, ar post Pending/Posted track kora.

## Ekhon ki ki kaj kore
- Shob kichu database e save hoy.
- **n8n ekhono connect kora nei.** Tai event gulo "waiting" hoye thake. Pore n8n connect korle "Send pending events" chaplei shob chole jabe, kichu harabe na.
- **Google review link ekhon nei.** Tai thank-you page e shudhu Facebook review button dekhay. Settings → Review links e Google link dile button nijei chole ashbe.
- **Chobi bodlano:** Dashboard → Settings → Form branding → Change photo → Save. Live form e shathe shathe bodle jay.

## Developer ke ki diben
- Puro zip ta din. Developer prothome `README.md` porbe, tarpor `docs/DEPLOY.md` follow kore live korbe.
- Developer nijer Claude Code use korle `CLAUDE.md` e shob niyom lekha ache, Claude puro idea ta bujhe nebe.

## Live korte ja lagbe
1. Supabase account (free): database er jonno.
2. Vercel account (free): app chalanor jonno.
3. Domain: jemon `feedback.argusofficial.com`. Apnar domain panel e ekta DNS record add korte hobe.
4. Pore: n8n (cloud ba nijer server), Google Sheet, WhatsApp er tool (WhatsApp Cloud API / Twilio).

## Demo dekhte chaile
Developer `npm install` ar `npm run dev` diye chalale sample data shoho demo chalbe:
- Login: `joy@argus.demo` / `argus-demo`
- Sample data shudhu demo te thake, real database e thake na.
