# Coșul meu
Small Romanian shopping-list app. Paste a WhatsApp screenshot into the visible text field like ChatGPT (Ctrl+V / Cmd+V), or drag/drop it. The image appears as an attachment; press **Fă lista** to perform OCR locally and create the editable shopping list. Text works in the same field. Tap products to move them into the basket below and tap again to return them.

## Privacy and limitations
- Screenshots exist only in memory and are revoked when removed or successfully imported. No upload endpoint, analytics, AI API, account, or payment.
- Only list names and purchased states are kept in this browser's localStorage. No cross-device sync.
- Browser downloads the app/OCR assets from the hosting origin; these requests reveal normal web access metadata to the host, not screenshot contents.
- OCR parsing uses line/word geometry to join wrapped comma-separated messages and unfinished quantity/product phrases before splitting products. Separate chat bubbles, bullets and normal newline shopping lists remain separate where identifiable; small lowered timestamps are filtered. This is heuristic, not a guarantee of understanding every message.
- OCR is not semantic AI: it can misread accents/quantities and include contact names. Correct or delete products with the pencil control after import. Crop tightly for best results.
- List is usable offline after initial app load, and OCR resources are cached as they are used. First OCR requires a connection.
- Screenshot formats: PNG, JPEG, WebP; max 12 MB/25 megapixels.
- Clipboard is read only on an actual paste event or explicit Lipește click. The latter may require browser permission. Where image clipboard access is unavailable, native paste or the attach-image button remains available. Mobile behavior depends on the OS/browser; no physical-phone test is claimed.

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
Optionally supply `CHROME_PATH=/path/to/chrome` to use an installed Chromium. Tests use synthetic light/dark WhatsApp-style fixtures, real OCR workers and real UI interactions. They use real OS/browser clipboard writes and trusted keyboard paste, and verify attachment rendering, retained drafts, removal, text paste, explicit paste, file fallback, invalid file errors, basket/undo/edit/reset/persistence, responsive captures and absence of screenshot upload/external OCR requests. Generated QA files stay in `.artifacts/`, excluded from Git.

To check a private original regression screenshot without publishing it:
```sh
SCREENSHOT_PATH=/absolute/path/to/private-screenshot.jpg APP_URL=http://localhost:4179/ node tests/ocr-wrapping.mjs
```
The file is read locally by the browser. Never commit user screenshots or their extracted private OCR dumps. Existing saved lists are not reinterpreted: use a new list and re-import after a parsing fix.

## Hosting
The production artifact is the **contents of `dist/`**, not the source root. All paths are relative, so GitHub Pages repository paths work. Publish artifact to `gh-pages` and configure Pages → branch `gh-pages`, directory `/`. `.nojekyll` is included. No custom GitHub Actions workflow/token scope required.

Vercel alternative: import this repository; Framework Preset **Other**, build command `npm run build`, output directory `dist`. No environment variables.

## Stack/licenses
Native HTML/CSS/ES modules, Tesseract.js 7 (Apache 2.0), Romanian and English language data, Phosphor icons (MIT). Their licenses are copied into the built artifact. No generated marketing images.
