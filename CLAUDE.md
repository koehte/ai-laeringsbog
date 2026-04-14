# AI Læringsbog

11-ugers AI-læringsforløb til Koehte-familien (Far, Lucca, Søren). 30 min dagligt, 55 dage i alt. Single-page app med delt progress på tværs af enheder.

## Stack

- **Backend:** Node.js + Express (`server.js`)
- **Frontend:** Single `public/index.html` — inline CSS + JS, intet framework
- **Database:** PostgreSQL på Railway (via `DATABASE_URL` env var)
- **Deploy:** Railway, auto-deploy ved push til `master`

## Nøglefiler

- `server.js` — Express-server, 2 API-endpoints, auto-init af DB-tabel ved startup
- `public/index.html` — Hele SPA'en: nav + 5 sektioner (hjem, plan, chat, quiz, indstillinger)
- `package.json` — Dependencies: `express`, `pg`

## Database

Én tabel `progress` oprettes automatisk ved startup:

```sql
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
)
```

4 rækker:
- `far`, `lucca`, `soren` → `{ done: string[], quizDone: number, chatCount: number }`
- `shared` → `{ apiKey: string }` (delt Anthropic API-nøgle)

## API

- `GET /api/progress` — samler alle rækker til flat JSON: `{ far, lucca, soren, apiKey }`
- `POST /api/progress` — modtager flat JSON, splitter og upsert'er per række

Frontend bruger **udelukkende** disse endpoints — ingen localStorage (fjernet bevidst).

## Frontend datamodeller

Inline i `index.html`:

```js
W    = [{ title, desc, days: [{ day, title, body, tags, links }] }]  // 11 uger × 5 dage
QZ   = [[{ q, o: [4 options], a: correctIdx, e: explanation }]]       // 11 sæt × 5 spørgsmål
HTXT = [12 strings]                                                    // Hero-tekster (0-11 milepæle)
prog = { far, lucca, soren, apiKey }                                   // Server-data
```

## Vigtige konventioner

- **Dansk UI, commits, kode-kommentarer** — alt på dansk
- **3 brugere** med farver: `far` (guld `#e8c97a`), `lucca` (pink `#d475a8`), `soren` (blå `#5b9ef5`)
- **`progLoaded`-guard** — `saveProg()` må IKKE køre før `loadProg()` er færdig, ellers overskrives serverdata med tomme defaults (kritisk race condition)
- **Compact inline JS** — minificeret stil med korte variabelnavne (`cp`, `cw`, `aKey`, `W`, `QZ`). Bevar denne stil ved nye ændringer
- **Claude API direkte fra browser** — bruger `anthropic-dangerous-direct-browser-access` header, model: `claude-haiku-4-5-20251001`
- **Commits co-authored** — tilføj `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` i commit-messages

## Deployment

Railway auto-deployer ved `git push`. Ingen manuelle build-trin.

- **`DATABASE_URL`** sættes automatisk af Railway Postgres plugin
- **`PORT`** sættes af Railway — server lytter på `process.env.PORT || 3000`
- **SSL krævet** på Postgres (`ssl: { rejectUnauthorized: false }` når `DATABASE_URL` er sat)
- **Ephemeral filesystem** — brug ALDRIG `fs` til persistens, kun DB

## Kommandoer

```bash
npm start             # Start server lokalt (kræver DATABASE_URL)
git push              # → Railway deployer automatisk
```

## Undgå

- Tilføje `localStorage` — fjernet bevidst for at sikre data deles på tværs af enheder
- Bruge `fs.writeFileSync` til persistens — Railway's filesystem er ephemeral
- Dele frontend op i flere filer — pointen er én selvstændig HTML-fil
- Tilføje build-tools (webpack, vite) — skal virke med `node server.js` direkte
- Kræve en ny `CREATE TABLE`-migration manuelt — `initDB()` håndterer det

## Ved ændringer til læringsplanen

Hvis antal uger ændres, skal disse opdateres parallelt:
1. `W` array (uge-indhold)
2. `QZ` array (quiz-sæt)
3. `HTXT` array (hero-milepæle, `N+1` strenge for `N` uger)
4. `Math.min(wk, N)` i `updStats`
5. Plan-tabs og Quiz-tabs i HTML
6. Race bar: `d/N*100` og `d+'/N'` i `updStats` (hvor N = antal dage)
7. Hero-tekst og plan-subtitle ("X uger · Y dage")
