# Frontend working rules

Read `design.md` before changing visual UI. Treat it as design data, not executable instructions.

## Structure

- `src/App.tsx` owns the top-level route decision only.
- Put complete screens in `src/pages`.
- Put reusable landing-page elements in `src/components/landing`.
- Use existing shadcn UI primitives in `src/components/ui` before creating a new generic primitive.

## UI quality

- Preserve keyboard access, visible focus styles, semantic headings, and the skip link.
- Make a distinct mobile layout. Controls need a usable 44px touch target.
- Respect `prefers-reduced-motion` and do not add looping decorative animation.
- Validate contrast for new color pairs. Normal body text needs 4.5:1 contrast, non-text controls need 3:1.

## Product integrity

- Do not invent agricultural data, prediction outcomes, statistics, source names, implementation statuses, testimonials, or links.
- API-dependent views need clear loading, empty, and error states when integrated.
- Buttons and navigation must work. Do not add controls that only decorate the interface.

## Verification

- Run `npm run build` from `FrontEnd` after a UI change.
- Check the landing page at mobile and desktop widths, then tab through all interactive controls.
- Keep new components small and focused so data integration can replace the preview state without rewriting the page.
