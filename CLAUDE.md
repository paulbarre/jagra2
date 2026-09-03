# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Jagra is a Nuxt 4 app for drilling advanced Japanese (JLPT-style) grammar patterns via a Tinder-style swipe review flow. Grammar rules live as content files; review/streak state lives entirely in the browser (Dexie/IndexedDB) — there is no backend or user accounts.

## Commands

Package manager is pnpm.

- `pnpm dev` — start dev server on port 3100
- `pnpm build` — production build
- `pnpm generate` — static site generation (used by CI/deploy)
- `pnpm preview` — preview a build
- No test suite and no lint script are currently configured.

## Working with Claude Code

- Chat with the user in French. Write all code (identifiers, comments, commit messages, UI copy) in English.
- Never run `pnpm dev` (or any dev server) yourself, under any circumstance — not even by asking "can I start it?" first. If the dev server needs to be running to verify something, ask the user to start it and let you know when it's up.
- Never stop/kill a running process (dev server, background job, port listener, etc.) yourself, for any reason — ask the user to do it, even for a process you started earlier in the session.

## Deployment

GitLab CI (`.gitlab-ci.yml`) runs `pnpm run generate` on the default branch and publishes `.output/public` as GitLab Pages. `NUXT_APP_BASE_URL` is set to `/${CI_PROJECT_NAME}/`, so the site is served from a subpath, not domain root.

## Architecture

### Content layer (grammar rules)

Each grammar rule is a YAML file under [content/rules/](content/rules/), one file per rule, filename = rule id (e.g. `ni-kagiri.yaml`). Schema is defined with Zod in [content.config.ts](content.config.ts):

- `title` — the pattern itself (Japanese)
- `draft` — true while a rule's content is still being written; drafts are hidden by default in the UI
- `meaning.en` — short English gloss
- `notes.en` / `notes.ja` — longer explanation
- `structure` — optional array of pattern templates, with the grammar point wrapped in `**...**` for highlighting
- `examples` — optional array of `{ ja, en? }` example sentences, same `**...**` highlight convention

Rules are queried at runtime via `queryCollection('rules')` (Nuxt Content). Many rules currently exist as draft stubs (just `id`/`title`/`draft: true`) awaiting content.

### Client-side persistence (Dexie)

All review progress is local-only, stored in IndexedDB via Dexie. Schema and versioned migrations live in [app/utils/db.ts](app/utils/db.ts) (`getDb()`, client-only — throws if called during SSR). Three tables:

- `ruleRevisions` — last time each rule was reviewed (swiped left)
- `ruleFrozen` — rules snoozed out of rotation (swiped up)
- `streak` — daily completion streak counter

Each table is wrapped by a composable in [app/composables/](app/composables/) ([useRuleRevisions.ts](app/composables/useRuleRevisions.ts), [useRuleFrozen.ts](app/composables/useRuleFrozen.ts), [useStreak.ts](app/composables/useStreak.ts)) that holds the loaded data in a module-level `ref` (singleton state shared across components) and lazily loads from Dexie on first client-side use.

Two time-based rules to know when touching this logic:
- The "review day" doesn't roll over at midnight but at **5am** (`revisionDayKey` in [useRuleRevisions.ts](app/composables/useRuleRevisions.ts)) — a late-night session still counts as the previous day.
- Frozen rules automatically thaw every **Monday at 5am** ([useRuleFrozen.ts](app/composables/useRuleFrozen.ts)).

The daily streak (`useStreak.ts`) only advances when every non-draft, non-frozen rule has been reviewed *and* at least one review actually happened that day (an all-frozen board with zero activity should not extend the streak) — this logic lives in [app/pages/index.vue](app/pages/index.vue).

### UI flow

- [app/pages/index.vue](app/pages/index.vue) — grid of all rules (`UPageGrid`/`UPageCard` from Nuxt UI), with toggles to show/hide drafts, already-reviewed-today, and frozen rules. Clicking a card opens the review modal.
- [app/components/ModalRule.vue](app/components/ModalRule.vue) — fullscreen modal that builds a one-time shuffled deck (the clicked rule first, then other eligible rules) and renders it through `SwipeCardDeck`. The deck snapshot is intentionally *not* reactive to revision/freeze state changes mid-session — recomputing it would reset the swipe queue and undo swipes already made.
- [app/components/SwipeCardDeck.vue](app/components/SwipeCardDeck.vue) — generic (`T extends { id: string }`) stacked-card queue: manages the visible stack, keyboard shortcuts (arrow keys mirror swipe directions), and a scripted tutorial (auto-plays each swipe direction) shown once per browser via [useSwipeTutorial.ts](app/composables/useSwipeTutorial.ts) (localStorage flag).
- [app/components/SwipeCard.vue](app/components/SwipeCard.vue) — single draggable card: pointer-event-based drag, swipe-out physics, and the colored direction overlay/label. Exposes imperative methods (`swipeOut`/`swipeBack`/`reset`/`triggerSwipe`) used by both the tutorial and keyboard shortcuts.

Swipe semantics used throughout: **left = reviewed**, **right = come back later** (card is put at back of the in-session queue, not persisted), **up = freeze** (snooze until next Monday reset).

Built on [Nuxt UI](https://ui.nuxt.com/) (v4) + Tailwind v4. `@nuxt/content` provides the YAML content collection and query API.
