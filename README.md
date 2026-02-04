# Seraph Safety Mission — Netlify Quick Deploy (Static Site)

This is a **no-build** static site intended for **fast deployment on Netlify**.

## Option A — Fastest: Drag-and-drop deploy
1. Log into Netlify.
2. Go to **Sites** → **Add new site** → **Deploy manually**.
3. Drag the *unzipped* folder contents (or the ZIP) into the deploy area.
4. Netlify will publish immediately.

## Option B — Git-based deploy (recommended for iteration)
1. Create a GitHub repo (private or public).
2. Commit everything in this folder.
3. In Netlify: **Add new site** → **Import from Git** → select the repo.
4. Build settings:
   - Build command: *(empty)*
   - Publish directory: `.`

## Files of note
- `index.html` — homepage
- `/whitepaper/` — whitepaper landing + embedded PDF
- `/resources/` — citation list with anchored links
- `/guides/` — quick guides
- `/assets/whitepaper.pdf` — hosted whitepaper
- `/assets/Seraph_Safety_Mission_CCBSS_PitchDeck.pptx` — hosted pitch deck
- `netlify.toml` — redirects + basic security headers
- `/contact/` — Netlify Forms-enabled contact form

## Update content
This site is plain HTML/CSS. You can edit any `index.html` directly in VS Code.

If you want a component framework later (Astro/Next), we can migrate after the deadline.
