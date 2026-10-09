# Coșul meu
Small Romanian shopping-list app. Import a WhatsApp screenshot, optionally crop to its message, perform OCR **locally**, review the extracted text, then tap products to move them into the basket below. Tap again to return them.

## Privacy and limitations
- Screenshots exist only in memory and are revoked when the import panel closes. No upload endpoint, analytics, AI API, account, or payment.
- Only list names and purchased states are kept in this browser's localStorage. No cross-device sync.
- Browser downloads the app/OCR assets from the hosting origin; these requests reveal normal web access metadata to the host, not screenshot contents.
- OCR is not semantic AI: it can misread accents/quantities and include contact names. Review is intentionally editable and required. Crop tightly for best results.
- List is usable offline after initial app load, and OCR resources are cached as they are used. First OCR requires a connection.
- Screenshot formats: PNG, JPEG, WebP; max 12 MB/25 megapixels.

## Build and run
```sh
npm ci
npm test
npm run build
python3 -m http.server 4179 --directory dist
```
Open http://localhost:4179/ (do not open index.html as a file URL).

## Browser integration QA
```sh
npx playwright install chromium
APP_URL=http://localhost:4179/ npm run test:browser
```
Optionally supply `CHROME_PATH=/path/to/chrome` to use an installed Chromium. Tests use synthetic light/dark WhatsApp-style fixtures, real OCR workers and real UI interactions. They verify basket/undo/edit/reset/persistence, responsive captures and absence of screenshot upload/external OCR requests. Generated QA files stay in `.artifacts/`, excluded from Git.

## Hosting
The production artifact is the **contents of `dist/`**, not the source root. All paths are relative, so GitHub Pages repository paths work. Publish artifact to `gh-pages` and configure Pages → branch `gh-pages`, directory `/`. `.nojekyll` is included. No custom GitHub Actions workflow/token scope required.

Vercel alternative: import this repository; Framework Preset **Other**, build command `npm run build`, output directory `dist`. No environment variables.

## Stack/licenses
Native HTML/CSS/ES modules, Tesseract.js 7 (Apache 2.0), Romanian and English language data, Phosphor icons (MIT). Their licenses are copied into the built artifact. No generated marketing images.
