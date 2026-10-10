# Site languages

The public site offers Russian (default), English, Tatar, Simplified Chinese and Spanish. The native language selector stays available through the intro and embedded site. Choices are stored under `ligarent.lang`; `?lang=en` (or `ru`, `tt`, `zh`, `es`) overrides the saved choice.

`translations.js` maps the original Russian copy to four translations, in the order English / Tatar / Chinese / Spanish. Keep all four entries when editing copy. Add new source phrases there when adding Russian UI text. Long phrases take precedence over reusable labels in composed text.

`language.js` retains original text per DOM node and observes text/label changes from the existing static scripts. It does not rebuild interactive components or alter input values. Photo credits and source links remain intact. The Telegram draft translates only fixed labels, preserving visitor input verbatim. `language.css` holds the selector and script-specific typography adjustments.

## Validation

Run `NODE_PATH=/path/to/node_modules node qa/languages.cjs` with Playwright available. The test uses installed Google Chrome; set `CHROME_PATH` to another Chromium executable as needed. Python 3 serves the local site on port 8766. It checks five locales at 390px and 1440px, gallery dialogs, navigation, recommendations, form preservation, persistence, embedded intro and Telegram draft construction without sending a message.

The older `qa/intro-scroll-regression.cjs` currently fails on the original main branch because its assertions expect an older intro implementation (`const siteUrl = './site.html'`). This language change does not alter that script or the intro controller.
