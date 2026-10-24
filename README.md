# LifePdf — Free browser tools, private by design

LifePdf is a static, GitHub Pages-ready collection of practical tools. File processing runs in the visitor's browser. There is no LifePdf backend, account system, database, analytics, or file-upload endpoint.

## Included working tools

### PDF
- Images to PDF (JPEG/PNG directly; other image types are converted to PNG in-browser)
- Merge PDF files
- Extract page ranges / selected pages
- Split a PDF by page range
- Rotate all PDF pages
- Inspect PDF page count and dimensions
- Render PDF pages to PNG/JPEG images and download as ZIP

### Images
- Resize with optional aspect-ratio preservation
- Compress/convert to JPEG, PNG, or WebP (actual size reduction depends on image and chosen format)
- Crop using pixel coordinates
- Read image dimensions and file size
- Bulk convert images and download ZIP

### Text, files and everyday utilities
- Word/character/sentence/line counter
- Text case conversion
- JSON formatter/minifier
- Base64 encode/decode for text
- SHA-256 file hash
- QR code generator
- Random password generator using Web Crypto
- Percentage calculator
- Length unit converter
- HEX/RGB/HSL color conversion
- Lorem ipsum generator

The interface deliberately does **not** claim that PDF compression, OCR, Word/Excel conversion, advanced PDF text editing, or PDF repair are implemented. These require specialized browser-side engines or more complex workflows. They are marked as planned rather than fake working buttons.

## Run locally

You can open `index.html` directly in a modern browser. Some browsers restrict local-file scripts; if so, run a local static server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a new repository on GitHub, for example `lifepdf`.
2. Upload **all files and folders** from this project to the repository root. Keep `index.html`, `app.js`, and `styles.css` at the root.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then save.
6. Wait for GitHub Pages to publish. Open the URL shown in the Pages section.
7. Test at least one PDF tool and one image tool on desktop and mobile.

No build command is needed. The site is static HTML/CSS/JavaScript.

## Privacy notes — please read

- Selected files are read and processed by JavaScript in the browser. The app does not send file bytes to a LifePdf server because no such server exists.
- No analytics, tracking pixels, ads, accounts, databases, saved history, or localStorage are used by the app.
- The page loads open-source libraries and fonts from third-party CDNs. Those CDN/font providers may receive standard network metadata (such as IP address, requested resource, and browser information). For a stricter network privacy model, download and self-host the dependency files and fonts after reviewing their license terms.
- Generated download URLs are temporary browser object URLs and are revoked after use where applicable. Text results are only kept in the current page DOM until the page is closed or the tool workspace is cleared.
- Browser extensions, malware, compromised devices, and browser vulnerabilities are outside this project's control.
- Very large PDFs/images can exhaust device memory. PDF rendering quality and browser-supported image output formats vary by device/browser.
- PDF files may be encrypted or malformed; such files can fail to process. Do not use this as a substitute for professional archival or legal workflows.

## Dependencies and licenses

The app uses the following third-party packages from CDN URLs (not bundled in this repository):

- **pdf-lib 1.17.1** — MIT License. Used to create, merge, split, rotate and inspect PDF files.
  - Project: https://github.com/Hopding/pdf-lib
- **PDF.js 3.11.174** — Apache-2.0 License. Used to render PDF pages to images.
  - Project: https://github.com/mozilla/pdf.js
- **JSZip 3.10.1** — MIT License. Used to package multiple outputs as ZIP archives.
  - Project: https://github.com/Stuk/jszip
- **QRCode.js** — MIT License. Loaded only when the QR tool is selected (see note below).
  - Project: https://github.com/davidshimjs/qrcodejs
- **DM Sans and Manrope fonts** — Open Font License (OFL), loaded from Google Fonts.

QRCode.js is loaded from CDN alongside the other dependencies.

For a production release, pin dependencies, review the exact upstream license files, and consider self-hosting the dependencies. This repository does not include the third-party library source code.

## Security and technical boundaries

- Password generation uses `crypto.getRandomValues`; generated passwords are not saved by the app.
- Base64 is not encryption.
- PDF page operations use `pdf-lib`. They do not OCR scanned text and do not provide arbitrary existing-PDF text editing.
- The image compressor re-encodes pixels through the browser Canvas API. JPEG/WebP can be lossy; PNG may grow rather than shrink.
- PDF-to-image output is rasterized and can become large at high scale.
- This is a client-side utility, not a malware scanner or a secure document-redaction system.

## License

The original LifePdf application code in this repository is offered under the MIT License; see `LICENSE`. Third-party dependencies remain under their respective licenses.
