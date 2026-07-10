# Peace At Home Parenting — Sitemap & Navigation Project Plan

Source data: `Pages PAH - Sheet1.csv` (166 pages, 419 courses, 749 lessons, 45 events)
and `PAH Page Groups and Timelines.xlsx` (client's in-progress planning workbook).
Companion app: `sitemap-app/` (React) — a working planner where every item below
can be reviewed and marked deleted without anything actually being removed.

## 1. What this plan covers

1. How every existing URL maps onto the new site structure.
2. Which URLs are candidates for removal, and why.
3. The exact structure of the new **primary** and **secondary** navigation, for
   all three audiences the site serves (public/B2B, logged-in client portals,
   open client pages).
4. How the React app implements "mark deleted, don't delete" and how to use it.

---

## 2. Content inventory

| Type | Count | Notes |
|---|---|---|
| Pages | 166 | Marketing, B2B, portal, resource guide, handout, and utility pages |
| Courses | 419 | Live/recorded workshops, LD (learning-design) courses, client-exclusive sessions |
| Lessons | 749 | Individual lesson pages, many nested under a specific course |
| Events | 45 | Calendar/webinar event pages |

Courses, lessons, and events are not restructured in this plan — they're
high-volume content that plugs into the new navigation via the **Resource
Guides**, **On-Demand**, and **Live Workshops** entry points rather than
being individually placed in the nav. The app's Courses/Lessons/Events tabs
let you search, filter by client (MIT, Emory, Yum Brands, Husky, Yale, BBBS,
Teladoc, Omnicom, the Hartford, Skillsoft), and mark any of them deleted the
same way as pages.

## 3. Page categories (166 pages)

The app auto-sorts every page URL into one of these buckets. Counts below are
from the current dataset; open the **Pages** tab in the app for the live,
clickable list.

| Category | Count | Description |
|---|---|---|
| Main Site | 24 | Home, Solutions, About, Resources, Contact, FAQs, legal pages |
| B2B / Institutional | 9 | `/corporate/`, `/school/`, `/college-mental-health/`, `/np/`, etc. |
| Client Portals | 44 | Logged-in, per-client branded portal pages (~14 orgs, each with a login + several sub-pages) |
| Open Client Libraries | 10 | Non-login client landing/library pages (BBBS, MPY, Bridgewell, CSO) |
| Resource Guides | 21 | On-demand guides organized by age/topic |
| Handouts | 13 | Printable handout pages, one per topic/age group |
| Utility / Account | 18 | Cart, checkout, register, profile, group-registration links |
| **Legacy Review** | **27** | Ambiguous, duplicate, draft, or test pages — needs a human decision |

## 4. URL mapping: old → new

The client's own "New Navigation" planning tab already specifies most of the
top-level redirects. The **Navigation Plan** tab in the app renders this as a
live table (title / old URL / new URL / status) pulled directly from the
spreadsheet, so it stays in sync if the workbook is updated and re-imported
(`npm run build:data`). Key mappings already defined by the client:

| Nav item | Old URL | New URL | Status |
|---|---|---|---|
| Home | peaceathomeparenting.com | `/home-new/` | In Review |
| Solutions | n/a (new page) | `/solutions/` | Completed |
| Employers | `/corporate/` (legacy domain) | `/corporate/` | Completed |
| Universities & Colleges | `/college-mental-health/` | `/college-mental-health/` | Completed |
| K-12 Schools | `/school/` | `/school/` | Completed |
| Resources | (new) | `/resource-page/` | In Progress |
| About Us | (new) | `/about-us/` | Completed |
| Contact | `/concierge/` | `/contact` | Requested |
| Family Service Organizations | `/np/` | *not yet built* | Requested |

Everything else in the "Legacy Review" and "Utility" buckets either has no
planned destination yet (meaning it should be evaluated for removal) or is
functional/transactional and simply carries over unchanged (cart, checkout,
login, profile).

## 5. Removal candidates

No page is deleted by this project — everything is **marked** in the app and
stays reviewable. The data pipeline pre-flags 32 pages using pattern rules
(duplicate `-2`/`-o`/`-o2` suffixes, `-old`/`-draft` suffixes, and known
dev/test pages like `/mixpanel-testing/`, `/wp-2fa-config/`, `/html/`,
`/acf-flexible-sections/`). Examples:

- `corporate-old`, `np-old`, `school-old`, `home-page-old` — superseded by current versions
- `college-mental-health-old`, `-old-2`, `-draft`, `-2` — four variants of one page; only one should survive
- `break-the-sceen-cycle-reclaim-connection-calm` **and** `-2` — duplicate
- `mixpanel-testing`, `wp-2fa-config`, `html`, `media-attachments`, `acf-flexible-sections`, `flexible-blocks` — dev/builder artifacts, not real pages
- `resource-page-o`, and the `-o`/`-o2` resource-guide variants — duplicate "open" copies of resource guides that likely need consolidating into one open/closed toggle rather than separate URLs
- `group-registration-mites`, `group-registration-mtlpa`, `group-registration-k12promo` — one-off promo links likely expired

A further 15 pages (e.g. `eap`, `peo`, `help`, `home-ad`, `our-experts-corporate`,
`college-mental-health-new`, `resource-guide-open-spanish-language-resources`)
are unclear from the URL alone and are left **unchecked** for a human to
decide — they show up under **Legacy Review** in the Pages tab with no
suggested reason, flagged simply by being uncategorized.

**Rule of thumb applied by the pipeline:** flag only things that are clearly
templates, tests, or literal duplicates of another page in the dataset;
anything ambiguous is surfaced but left for a human decision rather than
auto-checked.

## 6. New navigation structure

Rebuilt from the client's "Navigation 2.0" tab. Rendered live (with hover
dropdowns) on the **Navigation Plan** tab of the app.

### 6.1 B2B Navigation (public marketing site)

Primary nav:

```
Home
Solutions        ▾ Employers · Colleges & Universities · K-12 Schools ·
                    Childcare & Daycare Centers · Family Service Organizations · Parents
Services         ▾ Live Workshops · On-Demand Resources · Consulting ·
                    Professional Development
Resources
About Us         ▾ Our Story · Meet the Team · Advisors
Contact
```

Utility (right-aligned): **Schedule a Call** (CTA), **Sign In**, **Search**.

### 6.2 Portal Navigation (logged-in client portals — ~14 orgs)

One shared template, not one nav per client. Content items:

```
Resource Guides         (Open set OR Closed set, per client)
Quick Video Libraries   (Open set OR Closed set, per client)
Live Workshops
Recorded Workshops
Discussions with an Expert
Consulting              (toggle — hidden if client didn't purchase)
Search
Support / Contact
```

Required per-client elements every portal page must support: branded client
logo, a unique portal access code, a unique registration link, and a
per-portal newsletter link.

### 6.3 Open Client Navigation (non-login client pages — BBBS, Yale open library, CSO open, etc.)

```
Quick Tips
Break the Cycle
Discussion with an Expert
Blogs
Podcasts
Resource Guides · Open
Quick Video Library · Open
How Can We Help
Contact Us
```

## 7. How the mark-as-deleted workflow works

- Every page/course/lesson/event has a stable `id`. Marked-deleted state is
  stored in a Firestore document (`app/decisions`, `{ [itemId]: true }`) that
  every open browser subscribes to in realtime — the underlying dataset is
  never touched, and there's no export/import step: whoever else has the
  link (including the client) sees your checkbox changes appear live, and
  you see theirs.
- Items flagged by the removal-pattern rules are pre-checked the first time
  the database is seeded; anyone can uncheck them from then on.
- Marked items stay visible everywhere (struck through) so nothing silently
  disappears from the review.
- **Reset to suggested** / **Clear all** in the top bar let you re-run or
  blank the review pass at any point — instantly, for everyone.
- A **Live** badge in the top bar confirms the realtime connection is active;
  see `sitemap-app/README.md` for how to connect a Firebase project.

## 8. Editing the navigation plan and URL mapping

The **Navigation Plan** tab is fully editable, not just a preview:

- Every nav tree (B2B, Portal, Open Client) supports inline title editing,
  a "note" toggle for design callouts (like the "Parents should have a
  different menu" note), and buttons to add a child item, add a new
  top-level item, or delete an item (and its children).
- The Portal section's "required per-client elements" list and both nav
  descriptions are editable the same way.
- The **Old URL → New URL mapping** table supports editing every cell, a
  status dropdown, adding new rows, and deleting rows.

All of it saves to Firestore (`app/navigation`, `app/urlMapping`) on blur, so
it's live for anyone else viewing the app at the same time.

## 9. Regenerating the page/course/lesson/event inventory

If the client updates the CSV export or the XLSX workbook, re-run:

```
cd sitemap-app
npm run build:data
```

This re-parses both source files into `src/data/sitemap.json` without
touching any of the React code, the Firestore-backed mark-as-deleted
decisions, or the navigation/URL-mapping edits (those all live in Firestore,
keyed by stable ids/URLs, independent of this dataset file).

## 10. Open questions for the client (surfaced by the source data, not answered here)

- **Family Service Organizations** (`/np/`) has no destination URL yet — is this page still wanted?
- Four separate URLs exist for "college mental health" content (current, `-2`, `-old`, `-old-2`, `-draft`, plus two `-resources` variants) — which one is canonical?
- Several resource guides have both a normal and an `-o`/`-o2` "open" variant — should Open vs. Closed be a toggle on one URL instead of separate pages?
- `eap`, `peo`, `help`, `home-ad` have no clear purpose from the URL alone — confirm keep/remove.
