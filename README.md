# TripNest — CSE326 Travel Budget Planner

TripNest is a small travel-budgeting website made for a student project. It keeps destinations, trip dates, activity plans, and estimated or actual costs together in one browser page.

## Project files

- `index.html` — semantic HTML page, navigation, accessible form labels, input controls, and the course-topic guide.
- `style.css` — page colors, typography, box model, responsive layouts, focus styles, and print rules.
- `script.js` — demo profile, trip and place lists, form validation, cost calculations, page updates, and browser storage.
- `manus-routes.json` — single-page route information for the Manus preview. It is not needed by GitHub Pages.

This project uses plain **HTML, CSS, and JavaScript**. JavaScript is not the same language as Java. No framework, package installation, build command, server code, or database is required.

## CSE326 topics used

| Syllabus unit | Topics practiced | Example in TripNest |
| --- | --- | --- |
| I — HTML Fundamentals | HTML5 document, elements, attributes, text, lists, links and SVG | `index.html` has a page title, semantic layout, project mark and navigation. |
| II — Semantic HTML and Forms | Semantic sections, accessible labels, input types and validation | Forms use `label`, `type="email"`, `type="date"`, `type="time"`, `type="number"`, `required` and other controls. |
| III — CSS | Variables, selectors, box model, typography, Flexbox, Grid, pseudo-states and responsive design | `style.css` uses `:root` variables, Flexbox and Grid layouts, focus/hover styles, media queries and print rules. |
| IV — JavaScript Fundamentals | Variables, constants, strings, numbers, conditions, functions, arrays and objects | `script.js` stores trips and places as objects in arrays and uses named functions to calculate costs and update data. |
| V — Interactive Web Development | Loops, array operations, DOM updates, events, regex, dates, JSON and Web Storage | `script.js` responds to form, button and search events, validates email format, sorts dates, and uses `JSON.stringify`, `JSON.parse`, and `localStorage`. |
| VI — Development and Deployment | Code organization, debugging, GitHub repositories and GitHub Pages | The source is split into three files; the steps below explain a static GitHub Pages setup. |

The syllabus lists other areas, such as audio/video, iframes, Fetch, Geolocation and Drag and Drop. They are not forced into this project because they are not needed for travel budgeting. The CSE326 content covered by the website is also summarized in its **CSE326 guide** page.

## How the browser demo works

1. Choose **Create profile** and enter a name and email address. The email is checked with a simple JavaScript regular expression.
2. Create a trip. Its destination is added to the Places collection automatically.
3. Open a trip's itinerary section to add activities with a date, time, estimated cost and optional actual cost.
4. Use search, filters, and the star button to find and save trips. Open the trip section to edit activities, copy a text summary, or print.
5. Trip and place information is converted to JSON and saved using the browser's `localStorage`.

**Important:** The email-only profile is only a classroom demonstration. There is no password, server, shared database, or secure authentication. Data stays in this browser and device; it does not sync to other people or devices. Clearing browser data removes it. Do not put sensitive personal information in the site.

## Preview on your computer

1. Keep `index.html`, `style.css`, and `script.js` together in one folder.
2. Open a terminal in that folder and run `python -m http.server 8000` (on some systems, use `python3 -m http.server 8000`).
3. Visit `http://localhost:8000` in a browser.

You can also open `index.html` directly, but a local web server is a better way to practice how web pages load linked CSS and JavaScript files.

## Publish using GitHub Pages

1. Create a public repository on GitHub.
2. Add `index.html`, `style.css`, and `script.js` at the repository's top level. Add this README if you want. `manus-routes.json` is only for the Manus preview.
3. In GitHub, open **Settings → Pages**.
4. Select **Deploy from a branch**, choose the `main` branch and `/ (root)`, then save.
5. Wait for the Pages deployment, open the HTTPS URL, and try creating a profile, a trip, and an itinerary activity.

When uploading the files individually, make sure all three website files are in the same folder with the exact names shown above. The GitHub Pages link is public, but the demo data remains in each visitor's own browser.
