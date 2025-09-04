# Prompt-Powered Kickstart: Building a Beginner’s Toolkit for JavaScript + TailwindCSS
**Date prepared:** September 04, 2025

## 1) Title & Objective
**Title:** Getting Started with TailwindCSS (via CDN) and Vanilla JavaScript — Build a Simple Period Tracker  
**Objective:** Learn TailwindCSS utilities and basic DOM + date handling in JavaScript by building a privacy-first period tracker.

## 2) Quick Summary of the Technology
**TailwindCSS** is a utility‑first CSS framework providing small, composable classes (e.g., `p-4`, `flex`, `rounded-xl`) that let you build UIs rapidly without leaving your HTML.  
**Vanilla JavaScript** manipulates the DOM, handles localStorage, and performs date math for predictions.  
**Used in:** dashboards, SaaS apps, design systems, and prototypes.  
**Real example:** GitHub’s Primer has utility classes; many startups use Tailwind to ship UIs fast.

## 3) System Requirements
- OS: Windows/macOS/Linux
- Editor: VS Code (recommended)
- Browser: Any modern browser (Chrome/Firefox/Edge/Safari)
- Optional Node.js LTS if you want a production Tailwind build

## 4) Installation & Setup
### Option A — Fastest (CDN, no build)
1. Create `index.html`, include Tailwind Play CDN:
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```
2. Add your HTML and components.  
3. Add `app.js` and include `<script src="app.js"></script>` at the end of the body.

### Option B — Production Build (optional)
```bash
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```
- Configure `tailwind.config.js` `content` to include `index.html` and `app.js`.
- Create `src/input.css` with:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Build once: `npx tailwindcss -i ./src/input.css -o ./public/output.css --minify`
- Link `output.css` in your HTML.

Screenshots/terminal logs can be pasted here when you run the commands.

## 5) Minimal Working Example
This project’s MWE is included as the **codebase**. Open `index.html` and you’ll get:
- Form to log a start date + cycle lengths
- Next period + fertile window prediction
- 2 mini calendars with highlights
- Symptom logging with tags

See inline comments in `app.js` for how predictions are computed.

## 6) AI Prompt Journal
Document the prompts you used with **ai.moringaschool.com** (or ChatGPT). Examples below — replace with your real prompts and reflections.

### Prompt 1
- **Prompt:** “Write minimal HTML + Tailwind markup for a clean card layout with a form and a stats panel.”  
- **Response summary:** Produced a responsive 2‑column grid and form inputs.  
- **Reflection:** Helped me scaffold the layout quickly and learn Tailwind utilities like `grid`, `gap`, and `rounded-2xl`.

### Prompt 2
- **Prompt:** “Explain how to calculate next period and fertile window from last start date and average cycle length.”  
- **Response summary:** Clarified that ovulation ≈ cycle length − 14, fertile window ≈ ovulation −5 to +1.  
- **Reflection:** Good starting heuristic; documented disclaimer that predictions vary.

### Prompt 3
- **Prompt:** “Show a simple algorithm to render a monthly calendar grid in JavaScript.”  
- **Response summary:** Provided logic for weekday offset and date cells.  
- **Reflection:** I adapted it to highlight ranges with Tailwind classes.

(Add more prompts as you go.)

## 7) Common Issues & Fixes
- **Tailwind styles not loading (CDN):** Ensure the CDN `<script>` is in `<head>` and your network allows it.
- **Dates off by one:** Use local dates (YYYY‑MM‑DD) and construct `new Date(y, m-1, d)`. Avoid `Date.parse` on ambiguous strings.
- **Nothing renders:** Check console for errors; ensure `app.js` is referenced at the end of `body` so DOM exists.
- **Data missing after refresh:** localStorage is per‑browser and per‑origin; exporting JSON is recommended before clearing cache.
- **Build setup errors:** If using Option B, ensure `content` globs are correct so Tailwind doesn’t purge your classes.

## 8) References
- Tailwind CSS Docs — https://tailwindcss.com/docs
- MDN Web Docs (Dates, localStorage) — https://developer.mozilla.org/
- “Fertile window” overview (general heuristic) — reputable health org resources (summarize, avoid medical claims)

## ✅ Submission Notes
- Submit this `TOOLKIT.md` (or export to PDF) + the codebase ZIP.
- Include a short reflection on how AI changed your learning speed/clarity.
