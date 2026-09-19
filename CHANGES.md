# INRIS fix bundle — how to apply

Drop these files into your repo at the matching paths (they overwrite the
originals except where noted "NEW"). Everything here is additive to what
you already fixed yourselves (schema, prompts, chat grounding, redaction,
audit model name, health checks, the `NEXT_PUBLIC_AUTH_ENABLED` unification)
— none of that is touched again here.

## 1. Ingestion regression fix (do this first — uploads are currently broken)

- `src/lib/ingestion/pipeline.ts` — replaces the version that had crept back
  in with three separate bugs: wrong storage bucket name (`guidance-docs` vs
  the real `guidance-documents`), invalid `documents.status` values
  (`completed` / `error`, neither legal under the DB's CHECK constraint —
  every ingest, success or failure, was throwing), and PDF/DOCX support
  silently dropped in favour of a stub that only handles `.txt`/`.md`. This
  version uses the real `extract.ts`/`chunk.ts`, the correct bucket and
  status values, and creates a linked `guidance` row on success so uploaded
  documents actually show up on `/guidance` (FR-11).
- `src/components/staff/DocumentUpload.tsx` — adds the category selector
  that was missing (previously every uploaded document's guidance entry
  silently defaulted to "Other").
- `src/app/api/documents/route.ts` — reads that new `category` field from
  the form and passes it through.

**No `guidance_chunks`/`documents` schema changes needed** — migrations
004/005/006 already have the right shape; only the application code was
wrong.

## 2. UX fixes

- `src/components/staff/CaseAnalysis.tsx` — the AI Case Analysis card is now
  visually distinct from the Case details card next to it (muted
  background, no shadow, dashed border, a persistent "AI-generated — verify
  before acting" badge), matching what `docs/10_UI_UX_Specification.md`
  already asks for but the code didn't do.
- `src/components/staff/CaseForm.tsx` — creating a case now navigates
  straight to the new case's detail page instead of silently closing the
  form and refreshing a list. Landing on the page showing the new
  `INRIS-#####` number *is* the confirmation — previously there wasn't one.

## 3. PWA (new — this app had no manifest or service worker at all)

- `public/manifest.webmanifest` — installable, brand-coloured, standalone
  display mode.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` —
  **placeholder icons** (brand-blue square, "IN", accent bar) generated
  programmatically so the manifest is valid. Swap these for real artwork
  before shipping — they are not a design deliverable.
- `public/sw.js` — deliberately minimal. It only caches static shell assets
  and never touches `/api/*` or `/staff/*`, so it can't serve stale or
  sensitive data from cache. Page navigations are network-first; the
  offline page only shows if the network request actually fails.
- `public/offline.html` — the fallback shown on failed navigation.
- `src/components/PWARegister.tsx` — registers the service worker client-side.
- `src/app/layout.tsx` — wires up the manifest link, icons, and
  `<PWARegister />`.

## Still outstanding (not in this bundle, lower priority)

- `docs/05_MVP_Architecture.md` and `docs/06_Database_Design.md` still say
  "No auth in MVP" / "No vector DB in MVP" — documentation drift from
  before either was built. Worth a pass before anyone reviews the docs
  against the code.
- `src/types/index.ts` — stale duplicate of `database.ts`, appears unused.
  Safe to delete once you've confirmed nothing imports `@/types` directly.
- `CaseForm.tsx`/`DocumentUpload.tsx` now use `Button`'s `loading` prop;
  worth a final grep for any other hand-rolled `Loader2 + disabled` pairs
  elsewhere that could adopt it too, for consistency.
