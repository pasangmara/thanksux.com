---
name: poster-design-idea
description: Designs social-media posters for any topic or product in at least 4 different styles at once. It draws on the user's saved idea collection (9 styles, 27 reference posters) and raw asset library, builds the designs in the "Poster Design Idea Skill" Figma file, and writes a purpose note beside each one. Use whenever the user asks for a poster, social post, ad creative, or poster ideas or concepts (e.g. "burger poster", "earbuds ad", "poster design koro").
---

# Poster Design Idea

The user (Joy) keeps a growing collection of poster ideas and raw assets. Each
time they name a topic, design it in **at least 4 different styles side by
side**. That way they can compare the directions, choose one, and improve
through experiments.

## 0. Before every task (mandatory)

1. **Read `INSTRUCTIONS.md`** and follow every rule in it. Its rules override
   anything in this file.
2. **Sync the Figma instruction field.** Read text node `1:9` on page `0:1`
   (see `figma-map.json`). If it says something different from
   `INSTRUCTIONS.md` and is not the placeholder text, copy the new rules into
   `INSTRUCTIONS.md`, then follow them.
3. If the user writes `instruction update: …`, add the rule to
   `INSTRUCTIONS.md` and to the Figma field, then confirm in one line.

## 1. Understand the brief

From the user's message, collect: product or topic, brand name (if any),
offer, price, CTA, contact details, language (Bangla, English or both) and
size. Default size is **1080×1350 (4:5)**. Don't ask about things that have a
sensible default. Ask only when something essential is missing, such as the
product itself.

## 2. Pick at least 4 styles

Open `STYLES.md`. Choose **4 or more styles that are clearly different from
each other**: mix light and dark, photo and illustration, offer-led and
story-led. Pick the ones that fit the topic. Tech products always include S09.
Desserts usually include S07. Never present 4 near-identical variants.

## 3. Gather assets

Check `ASSETS.md` and use what's in `assets/` first. If a needed asset is
missing, give the user a ready-to-paste ChatGPT prompt for it, written in the
same format as the master rules (assets have no text and sit on a pure
background). Until it arrives, put a clearly labelled grey placeholder in the
design. Don't block on missing assets.

## 4. Build in Figma

- Use the file in `figma-map.json` and load the `figma-use` skill before any
  `use_figma` call.
- On page **"🎨 Experiments"**, create one row per topic: `<date> · <topic>`.
  Inside the row, put one frame per style, named `<topic> — S0X <style name>`.
- Next to each poster frame, add a **purpose note card** with:
  - **Purpose:** what this design must achieve (e.g. "launch awareness",
    "drive orders today").
  - **How it achieves it:** hierarchy, color, type, composition and CTA
    choices, and why each one works.
  - **Inspired by:** reference IDs (e.g. R07, R09).
  - **Assets used:** asset IDs.
  - **Experiment idea:** one thing to try next.
- Take a screenshot of each poster to check it: no clipped text, a readable
  headline at thumbnail size, and a visible CTA.

## 5. Report back

In chat, give a short table of style, one-line purpose and Figma link, then ask
which direction to push further. Good results can later become new reference
entries in `STYLES.md`.

## Hard rules

- Never copy brand names, logos, mascots or exact layouts from the references.
  Reuse the ideas only.
- Don't use assets marked "HAS-LOGO" in client work until the logo is
  retouched out.
- Keep all text editable in Figma. Don't bake text into images.
- Save new user-provided ideas or assets into `references/` or `assets/`, and
  update `STYLES.md` or `ASSETS.md` plus Figma whenever the user adds more.
