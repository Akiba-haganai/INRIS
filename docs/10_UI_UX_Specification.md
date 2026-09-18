# 10 — UI/UX Specification

## Design Principles

1. **Restrained, not decorative.** No gradients on functional surfaces, no
   emoji in UI copy, no "✨ AI magic" language.
2. **Authoritative tone.** Short sentences, plain nouns, active verbs. The
   assistant says "I couldn't find verified guidance for that question," not
   "Oops, I don't know!"
3. **Every async action has three states** — loading (skeleton, not spinner),
   empty, and error. No silent failures.
4. **Accessibility as baseline.** WCAG 2.1 AA contrast, ≥ 44 px touch targets,
   visible focus rings, semantic HTML, ARIA where structure alone is insufficient.
5. **Mobile-first, not mobile-only.** The layout starts at 375 px and expands
   gracefully. Nothing is added "for desktop" that isn't in the mobile version.

## Visual Language

### Typography
- **Typeface:** Inter (variable), fallback system-ui.
- **Scale:** `text-xs` (12) · `text-sm` (14) · base (16) · `text-lg` (18) ·
  `text-display` (fluid 24 → 36).
- **Weight:** 400 body, 500 controls, 600 headings, 700 hero only.
- **Measure:** max 65 characters per line of prose.

### Colour
- **Brand:** deep institutional blue (`--color-brand-700`) for primary actions
  and headers. Not blue-500. Deliberate, not loud.
- **Accent:** restrained gold (`--color-accent-500`) reserved for the MVP
  badge and nothing else.
- **Surface:** white on `surface-muted` (very light warm grey). No pure black.
- **Status:** open = blue, in_review = amber, resolved = green,
  closed = slate. Semantic only.
- **Priority:** urgent = red, high = orange, normal/low = slate.
- **Contrast:** all body text meets 4.5:1 minimum; headers meet 7:1.

### Motion
- **Duration:** 150 ms for micro, 250 ms for layout shifts.
- **Easing:** `ease-out` on enter, `ease-in` on exit. No bounce.
- **Respect `prefers-reduced-motion`** — collapse all transitions to 0 ms.

### Elevation
- Two levels only: `shadow-sm` (cards, forms) and `shadow-xl` (modal sheets).
- No layered shadows. No coloured shadows.

### Iconography
- Lucide only. 20 px inline, 16 px in buttons, 24 px in nav.
- Icons never replace text in primary actions.

## Layout

### Breakpoints
| Name   | Width      | Behaviour                                    |
|--------|------------|----------------------------------------------|
| `xs`   | 480 px     | Small phones — fluid typography activates    |
| `sm`   | 640 px     | Larger phones                                |
| `md`   | 768 px     | Tablets — sidebar nav replaces bottom nav    |
| `lg`   | 1024 px    | Small laptops                                |
| `xl`   | 1280 px    | Desktop — max content width 1152 px          |

### Shell
- **Header:** 56 px tall, sticky. Logo + MVP badge left, inline nav right on
  `md+`, hamburger on mobile.
- **Main:** max-width 1152 px, 16 px horizontal padding on mobile, 32 px on
  `md+`. Bottom padding 96 px on mobile (clears bottom nav), 32 px on `md+`.
- **Bottom nav:** visible only `< md`. Three tabs. Height 64 px + safe-area
  inset. Active tab in brand colour, others muted.
- **Footer:** visible only `md+`. Advisory disclaimer, 12 px, muted.

## Component Specifications

### Button
- Heights: 48 px mobile, 40 px desktop (`h-12 md:h-10`).
- Radius: 8 px.
- Variants: primary (brand-700 bg, white text), secondary (white bg, brand
  border), ghost (transparent, hover bg-brand-50), danger (red-600).
- Focus: 2 px ring in brand-500, 1 px offset.
- Disabled: 40% opacity, `cursor-not-allowed`, no hover state.

### Card
- Radius: 12 px.
- Border: 1 px `--color-border`.
- Shadow: `shadow-sm`.
- Header: 12–16 px padding, bottom border, title + optional subtitle + optional
  action slot right-aligned.
- Body: 16 px padding mobile, 20 px desktop.

### Input / Textarea / Select
- Height: 48 px mobile, 40 px desktop.
- Font-size: 16 px on mobile (**mandatory** — prevents iOS zoom).
- Focus: 1 px border brand-500, 2 px ring brand-500/30.
- Placeholder: muted at 70% opacity.

### Sheet (mobile drawer)
- Slides from right on mobile. 85 vw max, 320 px absolute max.
- Backdrop: slate-900/40 with 4 px backdrop-blur.
- Closes on backdrop tap, Escape key, or explicit close.
- Body scroll locked while open.

## Screen Specifications

### 1. Landing — Guidance Assistant
- **Hero:** "Passport guidance" (text-display), one-line description below.
- **Empty state:** centred prompt with five suggestion chips (New Passport,
  Renewal, Lost Passport, Replacement, Documents). Chips are pill-shaped,
  outlined, hover to brand tint.
- **Conversation:** user turns right-aligned in brand-700 pill, assistant turns
  full-width card with source cards underneath.
- **Sources block:** labelled "Sources", each row: title (semibold),
  category + provider (muted, small), verified date (muted, smallest).
- **Refusal state:** if `grounded=false`, show a subtle amber-bordered note:
  "No matching approved guidance was found. This assistant does not invent
  procedures." — no apology, no emoji.
- **Composer:** sticky above bottom nav on mobile; inline above footer on
  desktop. Textarea auto-rows 2–6. Enter sends, Shift+Enter newlines.

### 2. Guidance Library
- Two-column grid on `md+`, single column mobile.
- One card per category. Card header: category name + entry count. Card body:
  list of entries with title (semibold), 3-line preview of content, source line
  in smallest muted type.
- Header disclaimer: "Content below is synthetic demo material pending
  authoritative INRIS sources." → replace with "Approved guidance. Last
  reviewed {date}." once real content loads.

### 3. Staff Dashboard
- **Header:** title + one-line subtitle. New Case button right-aligned
  (full-width on mobile).
- **Stats strip:** 4 cards in 2×2 grid mobile, 1×4 grid `md+`. Values in
  `text-2xl` semibold. "Needs review" accent-coloured if > 0.
- **Two charts:** stacked mobile, side-by-side `md+`.
  - Cases by category — horizontal bars, brand-700 fill, max width scaled to
    the largest count.
  - Common issues — list with pill counts right-aligned, no bars.
- **Filters:** stacked mobile, inline `md+`. Search input flexible, status
  select fixed width, Apply button, Clear link.
- **Case list:** card list on mobile, table `md+`. See component below.

### 4. Case Detail
- **Header:** back link, case number (monospace, semibold), opened date.
  Status controls scroll horizontally on mobile.
- **Two-column grid** `lg+`, stacked below.
- **Left — Case details:** label/value pairs for category, status, priority;
  full description in prose with 65-char measure.
- **Right — AI Case Analysis:**
  - Header with "Run analysis" / "Re-run" button.
  - If no analysis: empty state explaining what running analysis does, no
    call-to-action pressure.
  - If analysis: review badge (amber if required, green otherwise) + confidence
    percentage. Then fields: Summary, Key issues (bulleted), Missing
    information (bulleted), Suggested next step, Relevant guidance (list of
    titles with category/source).
  - All AI fields visually de-emphasised relative to Case details — they are
    suggestions, not facts.

## Copy Tone Guidelines

| Situation         | Do                                              | Don't                                    |
|-------------------|-------------------------------------------------|------------------------------------------|
| Refusal           | "I couldn't find verified guidance for that question." | "Sorry, I'm not sure!"             |
| Loading           | "Retrieving guidance…"                          | "Thinking… ✨"                     |
| Error             | "The assistant is temporarily unavailable. Please try again, or consult INRIS." | "Oops! Something went wrong." |
| Empty case list   | "No cases match the current filters."           | "There's nothing here yet! 🎉"   |
| Button            | "Run analysis"                                  | "Analyze with AI ✨"                |

## Non-Goals

- No dark mode in the MVP. The palette assumes light backgrounds.
- No onboarding tour, no tooltips, no product announcements.
- No avatar bubbles, no typing indicators with character dots.
- No push notifications, no toast stack — inline messages only.
- No custom illustrations. Icons from Lucide, nothing else.

## Acceptance

The UI passes when:
- Every screen renders cleanly at 320, 375, 768, 1024, and 1440 px.
- All interactive elements meet 44 px minimum on mobile.
- Every async surface has visible loading, empty, and error states.
- No text uses exclamation marks, emoji, or the word "magic".
- Keyboard navigation reaches every interactive control with visible focus.
