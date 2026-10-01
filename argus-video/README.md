# ARGUS video: upload folder

Google Flow er clip ar Joy er nijer clip ekhane upload korun. Upload hole ami ekhan theke niye final video banabo.

| Folder | Ki rakhben | Naam |
|---|---|---|
| `flow-clips/` | Google Flow er clip | `F01.mp4`, `F02.mp4` … `F18.mp4` |
| `joy-clip/` | Joy er nijer record kora 8–10 second er clip | `joy.mp4` (ba `.mov`) |

Plan: `00-plan.md` · Flow prompt: `01-flow-prompts.md`

---

## GitHub e kivabe upload korben (phone ba computer)

1. Browser e repo khulun: `github.com/pasangmara/thanksux.com`
2. Upore baam dike **branch** button chapun → **`claude/argus-brand-identity-6v1tvp`** select korun.
   > Branch thik na hole ami file pabo na.
3. `argus-video` → `flow-clips` folder e jan.
4. **Add file → Upload files** chapun.
5. Clip gulo drag kore din (ba "choose your files").
6. Niche **"Commit directly to the `claude/argus-brand-identity-6v1tvp` branch"** select thakbe → **Commit changes**.
7. Joy er clip ek-i bhabe `joy-clip/` folder e din.
8. Shob upload hole amake chat e bolun **"upload done"**.

## Size er niyom

| Limit | Ki korben |
|---|---|
| GitHub website e protita file **25 MB** porjonto | 8 second er 1080p clip shadharonoto 5–20 MB, tai cholbe |
| 25 MB er beshi hole | Oi clip ta chat e shorasori upload korun, ba compress kore din |
| Ek bare onek file | 5–6 ta kore upload korun, protibar commit |

## Mone rakhun

- File er naam hubohu `F01.mp4` … rakhun. Onno naam hole ekta list pathan kon ta kon clip.
- Ek clip er 2 ta version rakhte chaile `F01-b.mp4` naam din, ami duitai dekhe bhalo ta nibo.
- Ei folder shudhu kaj er jonno. Website build e (`argus-site/`) ei video gulo jay na.
