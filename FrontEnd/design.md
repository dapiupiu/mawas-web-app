# Mawas design direction

## Identity

Mawas is a public reading surface for food-risk information. It should feel calm, grounded, and usable before it feels like a generic administration dashboard.

## Visual system

- Primary surface: warm rice white `#F5F1E8`.
- Primary ink: forest green `#173E32`.
- Supporting green: `#36564A` and sage `#DCE7D7`.
- Warning accent: ochre `#B97A16`, used only for navigation focus and meaningful emphasis.
- Risk colors: green `#6D9670`, amber `#966A13`, red `#BB5B42`. Never use them without a text label.
- Geist is used for UI clarity. Georgia is reserved for editorial headings to make the information feel considered rather than dashboard-like.

## Composition and motion

- Dial: ENERGY 2 / RHYTHM 3 / MOTION 2.
- The identity motif is thin, quiet contour lines plus map-shaped information blocks. It references agricultural terrain and is never used as filler behind readable text.
- Sections alternate between editorial text, map reading, a linear process, and an operational status panel.
- Motion uses one short reveal on entry to establish reading order. Route changes move the exiting screen upward, run a brief contour-and-skeleton flash, then bring the destination in from below. Hover feedback is small. No infinite motion.

## Content rules

- Do not show current numbers, forecasts, named interventions, or data freshness unless supplied by an API or a cited source.
- Prototype-only table values are permitted when the owner explicitly requests them, but they must carry a prominent `DATA CONTOH` label and a note that they must be replaced by API data before publication.
- Unavailable data must say why and what will happen when the source is connected.
- Public navigation must only point to existing sections or implemented routes.
- The public map lives at `/peta-risiko` and fills the viewport. Before API integration, it must describe itself as an interactive demonstration and keep food data in an explicit unavailable state.
- Use Indonesian that is direct and specific. Avoid unverified product claims, fake testimonials, and decorative status language.

## Implementation conventions

- Pages live in `src/pages` and compose reusable landing components from `src/components/landing`.
- Keep route selection in `App.tsx` until a router is introduced.
- Use shadcn components for controls and cards. Keep page-specific visual components local to `components/landing`.
- Every interactive element needs a destination or state change and a visible keyboard focus style.
