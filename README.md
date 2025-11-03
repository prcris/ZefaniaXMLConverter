# Zefenia XML Converter

Convert Bible XML files to the Zefenia XML standard through a simple, multilingual web app. Built with Node.js, Express, xml2js, and a lightweight vanilla JS + Bootstrap UI.

## Highlights

- Multiple input formats: OSIS, simple XML, and nested structures like `<testament>/<book>/<chapter>/<verse>`
- Clean Zefenia XML output (UTF‑8 without BOM; valid XML prolog)
- Smart book mapping (by number/name) and duplicate‑safe verse handling
- Temporary, tokenized downloads that expire after ~2 hours (no persistent storage)
- Multilingual interface: PT, EN, ES, RU, UK (easy to add more)
- Accessible UI with drag‑and‑drop upload, progress, and success/error feedback

## Requirements

- Node.js 18+ recommended
- npm (bundled with Node)

Optional (Windows):
- Git + GitHub CLI (`gh`) to use the included helper script for creating/pushing a GitHub repo

## Quick start

```powershell
# Install dependencies
npm install

# Start the server
npm start

# (Dev mode with auto‑reload)
npm run dev
```

Open http://localhost:3000 and upload your Bible XML. After the conversion finishes, click “Download Converted File” — the URL is a short‑lived token and expires in ~2 hours.

## Project structure

```
src/
	public/
		index.html      # Main UI (data‑i18n attributes for all texts)
		script.js       # Upload flow, i18n, download handling, visit counter
		styles.css      # Styles (light/dark friendly)
		favicon.svg     # Served at /favicon.ico
	routes/
		convert.js      # POST /convert and GET /download/:token
	utils/
		xmlParser.js        # Parses input XML (OSIS/simple/nested)
		zefeniaConverter.js # Builds Zefenia XML with xmlbuilder2
		xmlSanitizer.js     # Strips BOM/whitespace; ensures XML prolog
		tempStore.js        # In‑memory token store with TTL (~2h) + sweeper
	server.js         # Express setup, static files, translations endpoint
locales/
	en|es|pt|ru|uk/translation.json  # UI translations
examples/            # Optional sample XMLs for local testing
create_github_repo.bat # Helper to create a GitHub repo and push (Windows)
```

## How it works

1. Upload: the server receives the XML via `POST /convert` (multer)
2. Parse: `xmlParser` detects the structure and extracts books/chapters/verses
3. Convert: `zefeniaConverter` generates standard Zefenia XML
4. Sanitize: `xmlSanitizer` guarantees a clean XML prolog and UTF‑8 (no BOM)
5. Deliver: a temp file is registered in `tempStore` and a download token is returned
6. Download: the client fetches `/download/:token` and saves the XML

## Endpoints

- POST `/convert`
	- Form‑data: `xmlFile` (file)
	- Response (200):
		```json
		{
			"downloadUrl": "/download/<token>",
			"convertedName": "<suggested-name>.xml",
			"stats": { "books": 66, "chapters": 1189, "verses": 31105 }
		}
		```
- GET `/download/:token`
	- Streams the converted XML, 404 when token is invalid/expired
- GET `/api/translations/:lang`
	- Returns translations for `pt|en|es|ru|uk`
- GET `/languages`
	- List used to populate the language dropdown

## Internationalization (i18n)

- All visible texts in `index.html` use `data-i18n="..."`
- `script.js` loads `/api/translations/:lang`, applies texts, and sets `<html lang>`
- Add a new language by creating `locales/<code>/translation.json` and allowing it on the server

## Security & privacy

- Files are temporary and auto‑cleaned after ~2 hours; links are token‑based
- The app does not keep a permanent catalog or store user files beyond the TTL

## Troubleshooting

- “Content not allowed in prolog”: the sanitizer writes a clean prolog and UTF‑8 without BOM; verify the source XML encoding if the error persists
- Downloading JSON instead of XML: the client must follow the `downloadUrl` from `/convert` (handled by `script.js`)
- Mixed/duplicated books: the parser prefers `book.number` and includes extended name mappings; open an issue with a sample if your format is unique

## Optional: create a GitHub repo (Windows)

Use the helper script to create/push a repository via GitHub CLI:

```powershell
./create_github_repo.bat                 # Uses folder name (private)
./create_github_repo.bat MyRepo public   # Public repo
./create_github_repo.bat MyRepo private MyOrg "Initial commit"
```

## License

MIT

# ZefeniaXMLConverter
Conversor de XML para Zefenia
