# TripNest CSE326-aligned rebuild plan

## Goal and constraints
Keep the assigned Travel Budgeting Tool and the previously approved TripNest travel-journal visual direction, while making the implementation visibly grounded in the CSE326 syllabus. Use only plain HTML5, CSS, and browser JavaScript in separate files so a beginner can read and explain them. Do not add a framework, build tool, server, database, or production-authentication claim. A local browser email profile and trip data are classroom-demo-only; state their limits in the UI and README.

## Course concept application
- **HTML units I–II:** document structure, semantic page regions, SVG wordmark, accessible names and labels, links, and forms with email/date/time/number controls and native validation.
- **CSS unit III:** CSS variables, selectors, colors, box model, typography, pseudo-states, Flexbox navigation, Grid trip cards, focus styles, transitions, and responsive breakpoints.
- **JavaScript unit IV:** clear constants and variables, strings/numbers/booleans, conditions, named functions, arrays, and plain objects.
- **JavaScript unit V:** loops/array operations, DOM selection and rendering, event handling, regular-expression email validation, date/time inputs, localStorage and JSON for local persistence, clipboard sharing, and print support.
- **Unit VI:** separate source files, browser-preview/debug workflow, source repository organization, and beginner GitHub Pages steps in README.

Avoid adding course topics that do not benefit the assigned travel-planning problem. The user-facing course guide will distinguish what is implemented from what is outside this static project, such as a true server-backed account system.

## Project structure
- `index.html` — semantic page layout, navigation, account/trip/place/activity forms, content regions, and course concept guide.
- `style.css` — palette, type, components, desktop/mobile layouts, focus/hover states, motion, and print rules.
- `script.js` — browser-local data, account demo, validation, trip/place/activity operations, DOM rendering, search/filter/favorites, and share/print actions.
- `README.md` — setup, course-to-code map, limitations, and deployment steps.
- `manus-routes.json` — the single static page route for the preview runtime.

The app stays a static single-page site. `localStorage` uses JSON so trips remain in the current browser, but it does not sync between people/devices and is not a secure account store.
