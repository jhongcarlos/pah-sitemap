// Seed data for the "navigation" Firestore document. Only used the very
// first time the app runs (no doc exists yet) — after that, everything
// lives in Firestore and this file is never read again.
let seedCounter = 0;
function id() {
  seedCounter += 1;
  return `seed-${seedCounter}`;
}

function node(title, extra = {}) {
  return { id: id(), title, children: [], ...extra };
}

export function buildDefaultNavigation() {
  return {
    b2b: [
      node('Home'),
      node('Solutions', {
        children: [
          node('Organizations (Employers)'),
          node('Universities & Colleges'),
          node('K-12 (Public & Private)'),
          node('Family Service Organizations'),
          node('Parents and subpages should have a different menu', { note: true }),
        ],
      }),
      node('Services', {
        children: [
          node('Live Workshops'),
          node('Resource Guides'),
          node('1:1 Consulting'),
          node('Professional Development'),
        ],
      }),
      node('About'),
      node('Login'),
      node('Contact'),
    ],
    portal: {
      description:
        'For logged-in client portals (BBBS, Yale, CSO, Emory, ~14 total). Every portal page shares this shell; only the logo, resource sets, and registration link change per client.',
      nav: [
        node('Resource Guides', { children: [node('Open set'), node('Closed set')] }),
        node('Quick Video Libraries', { children: [node('Open set'), node('Closed set')] }),
        node('Live Workshops'),
        node('Recorded Workshops'),
        node('Discussions with an Expert'),
        node('Consulting', { note: true }),
        node('Search'),
        node('Support / Contact'),
      ],
      required: [
        { id: id(), text: 'Client logo (branded)' },
        { id: id(), text: 'Unique portal access code' },
        { id: id(), text: 'Unique registration link' },
        { id: id(), text: 'Newsletter link (per portal)' },
      ],
    },
    openClient: {
      description: 'For open (non-login) client pages — BBBS landing, Yale open library, CSO open, etc.',
      nav: [
        node('Quick Tips'),
        node('Break the Cycle'),
        node('Discussion with an Expert'),
        node('Blogs'),
        node('Podcasts'),
        node('Resource Guides · Open'),
        node('Quick Video Library · Open'),
        node('How Can We Help'),
        node('Contact Us'),
      ],
    },
  };
}
