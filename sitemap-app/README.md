# PAH Sitemap & Navigation Planner

A React app that maps every page, course, lesson, and event currently on
peaceathomeparenting.com against the proposed new navigation, lets anyone
mark items for removal without deleting anything, and lets you edit the
navigation plan and URL mapping table directly — all synced in realtime via
Firebase so everyone sees everyone else's changes live.

See `../PROJECT_PLAN.md` for the full write-up (URL mapping, removal
rationale, and the exact primary/secondary nav structures).

## 1. Connect Firebase (one-time)

The app needs a Firestore database to save and sync anything. Without it,
edits work in your current browser tab only and are lost on refresh.

1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create database** (test mode is fine for an unlisted link).
3. **Project settings → Your apps → add a Web app (`</>`)** and copy the config values it shows you.
4. Copy `.env.example` to `.env` and fill in the six `VITE_FIREBASE_*` values from that config.
5. Restart `npm run dev` (Vite only reads `.env` at startup).

The top bar shows a **Live** badge once it's connected. Until then you'll see
a "Not connected to a database" banner.

## 2. Run it

```
npm install
npm run dev
```

Open the printed local URL. Build for deployment with `npm run build`
(output in `dist/`) — this is a static site, so it deploys to Vercel with no
extra configuration beyond adding the same `VITE_FIREBASE_*` values as
Environment Variables in the Vercel project settings.

## 3. Regenerate the page/course/lesson/event data

If the client sends an updated CSV export or XLSX planning workbook, drop
them in the parent folder (same file names) and run:

```
npm run build:data
```

This re-parses `../Pages PAH - Sheet1.csv` and
`../PAH Page Groups and Timelines.xlsx` into `src/data/sitemap.json`. It only
touches that inventory — navigation edits and mark-deleted decisions live in
Firestore and are unaffected.

## How it's stored

Everything below lives in three Firestore documents (collection `app`), each
subscribed to in realtime with `onSnapshot` — there is no localStorage and no
export/import step:

- **`app/decisions`** — `{ [itemId]: true }` for every page/course/lesson/event
  currently marked deleted. Toggling a checkbox anywhere writes here
  immediately; every open browser tab (yours or the client's) updates live.
- **`app/navigation`** — the editable B2B / Portal / Open Client nav trees and
  the portal's required-elements list.
- **`app/urlMapping`** — the editable old→new URL mapping table rows.

The first time the app runs against a fresh Firestore database, it seeds
these three documents from `src/data/defaultNavigation.js`,
`src/data/defaultUrlMapping.js`, and the pipeline's `suggestedDelete` flags —
after that, Firestore is the only source of truth and those seed files are
never read again.
