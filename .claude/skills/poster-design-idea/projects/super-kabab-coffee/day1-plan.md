# Day 1 Plan: "ফোন রিচার্জ হচ্ছে, আপনিও হোন" (A2 repair waiters)

- **Figma:** ✏️ Research & Sketch → section "SKC Day 1 … · plan"
  (node 7:2).
- **Previews:** `previews/SKC-D1-A-message-led.jpg` and
  `previews/SKC-D1-B-visual-led.jpg`. These are photo-sketches built by
  `scripts/skc_day1.py`.
  - Fonts: Anek Bangla + Baloo Da 2 from the npm @fontsource packages.
  - The script needs `npm pack @fontsource/anek-bangla @fontsource/baloo-da-2`
    extracted into a fonts directory.

## 3-second eye path (what the viewer imagines without reading)
1. **0–0.5s, recognise:** a cold, crowded corridor and a red 5% battery.
   *"That's me, at Motalib Plaza."*
2. **0.5–1.5s, see the way:** a glowing diagonal doorway and a "২ মিনিট"
   arrow. *"There's a seat nearby."*
3. **1.5–2.5s, experience:** a warm café, a man relaxing with coffee and
   his phone, 100% battery. *"I'll sit, have coffee, pass the time on
   Wi-Fi."*
4. **2.5–3s, decide:** the chips (coffee + firni ৳১৯৯, free Wi-Fi,
   location). *"I know the cost and the place. I'll go."*

## Imagined in-store journey (zero confusion)
Each step comes with its answer:
1. Hand the phone to the technician ("1 hour").
2. Walk 2 min: Motalib Plaza lane, shown with a pin.
3. Seat: 20–50 seats.
4. Order: coffee + firni ৳১৯৯, served in 5 min.
5. Pass the time on Wi-Fi.
6. Technician calls: quick bill by bKash, Nagad or cash.
7. Leave "fully charged", and scan the review QR.

## Layout zones
- **A (message-led):** reads as question → promise (headline + battery) →
  support line → real table experience (coffee, firni, steam) → location →
  decision chips.
- **B (visual-led):** reads as pain (desaturated corridor, 5%) → path
  (diagonal light doorway + ২ মিনিট) → relief (warm café + man at 100%) →
  chips.
- **Manipulation:**
  - A: cutouts placed on a real table with shadows, and steam with a
    screen blend.
  - B: two places joined in one frame, cold → warm colour temperature.
- **Motion:**
  - A: the steam rises while the battery fills 5→100%.
  - B: a diagonal wipe from the corridor to the café while the battery
    fills (a 3-second Reel).

## Open items before posting
- Coffee and firni are AI stand-ins. Replace them with SKC's real photos.
- Hi-res logo needed. The preview uses a crop of the low-res JPG.
- SKC-02 (phone on the repair bench) wasn't needed. The man's phone and the
  battery icons carry the idea.
- Next: competitor compare (Phase 9), then Design C (merge), then
  scorecards.
