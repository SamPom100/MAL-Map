# AGENTS.md

Operating guide and architectural invariants for autonomous agents working in `MAL-Map`.

---

## 1. Project Overview & Architecture

MAL-Map is an interactive WebGL graph visualization of 3,400+ anime franchises, clustered by theme and recommendation proximity.

* **Repository**: Forked from `platers/MAL-Map` to `SamPom100/MAL-Map`.
* **Hosting**: GitHub Pages via GitHub Actions at `https://sampom100.github.io/MAL-Map/`.
* **External Integration**: `sampomerantz.me/malmap` redirects directly to GitHub Pages. Never commit compiled frontend bundle files into `astroPersonal`.

### Directory Layout

* `svelte/`: Svelte 3 + Pixi.js (v6) + Webpack 5 frontend.
* `data-collection/`: Node.js + TypeScript pipeline that polls MAL API v2 and AniList GraphQL to compute force-directed layouts, Infomap clustering, and recommendation edges.
* `data-collection/venv/`: Python virtual environment containing `cdlib`, `networkx`, and `infomap` used by `cluster.py`.
* `data-collection/data/`: Static JSON artifacts consumed by the frontend and CI. The following files MUST remain tracked in git:
  * `min_metadata.json`: Compact anime details (titles, images, scores, genres, members).
  * `layout.json`: 2D node coordinates (`x`, `y`) and hue angles.
  * `edges.json`: Franchise recommendation graph edges.
  * `clusters.json`: Hierarchical cluster assignments.
  * `ids.json` & `ids-anilist.json`: Discovered anime IDs from MAL and AniList.
* `.github/workflows/deploy.yml`: Automated CI pipeline that builds and publishes `svelte/public` to `gh-pages` branch upon push to `master`.

---

## 2. Hard Invariants & Development Rules

### Approval Before Production
* **Never push to production without explicit user approval.**
* Always build, run, and verify changes locally on `http://localhost:8080/`. Only push to GitHub after Sam approves.

### AniList GraphQL Constraints
* **Always specify `type: ANIME` when querying AniList with `idMal`.** AniList shares ID namespaces across media types. Omitting `type: ANIME` returns manga IDs and corrupts franchise metadata (for example, MAL ID 63509 returned manga *Sonicomi* instead of anime *Dark Summoner to Dekiteiru*).
* **Respect rate limits (90 req/min).** Inspect `Retry-After` headers and back off upon HTTP 429.
* **Pagination check:** Only break pagination loops when `hasNextPage === false`. Never break on empty or undefined `json.data.Page`.

### Data Filtering & Discovery
* **Allowed Formats:** Include `['tv', 'ona', 'movie', 'ova', 'tv_special']`. Never filter down to standard TV only.
* **Dual-Source Discovery:** Discovered shows come from MAL top 5,000 popularity and AniList top 3,000 popularity (`media(sort: POPULARITY_DESC, type: ANIME)`).
* **Cutoff Bypass:** Shows discovered via AniList bypass MAL's strict popularity rank cutoff (`popularity < 4000`).
* **Franchise Deduplication:** Deduplicate sequels, movies, and spin-offs into canonical parent franchises and pool recommendation weights.

### Image Rendering & WebGL CORS
* **Direct CDN URLs:** MyAnimeList image URLs (`https://myanimelist.net/images/...`) issue HTTP 301 redirects to CDN without `Access-Control-Allow-Origin` headers. WebGL canvas texture loaders fail CORS security checks on redirects. Always rewrite image URLs to `https://cdn.myanimelist.net/`.
* **Thumbnail Zoom Cutoff:** In `svelte/src/ts/draw.ts`, keep the zoom threshold at `1500` world units or higher so bubble thumbnails activate on normal zoom levels and show selection.

### Viewport & Trackpad Pinch Zooming
* **Prevent Native Browser Zoom:** macOS trackpad pinch emits `WheelEvent` with `ctrlKey: true`. To keep side menus and HTML stationary, `pixi-viewport` must use `passiveWheel: false` and `{ trackpadPinch: true, wheelZoom: true }`.
* **Touch Actions:** Keep `touch-action: none` on the `<canvas>` element and `maximum-scale=1, user-scalable=no` in `svelte/public/index.html`.

### Cluster Boundaries & Dynamic Highlight
* **32 Cluster Hues:** Layout positions assign hues in exact 11.25° increments (`0.00°` to `348.75°`). Hue names are registered in `svelte/src/ts/cluster_names.ts`.
* **Hidden by Default:** Cluster boundary circles and region labels must remain hidden on initial load to avoid visual clutter.
* **Hover Reveal Timing:** Hovering or selecting an anime fades in the cluster boundary over 250ms, holds for 5,000ms, and fades out over 600ms.
* **Anti-Flicker Invariant:** Moving between nodes in the same cluster must NOT restart the fade-in animation. If the cluster is already visible, maintain full opacity (`alpha = 1.0`) and extend the 5-second timer.
* **Tight Radius:** Cluster circles calculate radius from the 95th-percentile node distance plus 60px padding, avoiding runaway sizes from outlier nodes.

### Sidebar UI Invariants
* **Top-Level Flat Layout:** Do not nest controls in a collapsible "Filters" accordion. Keep sliders, search bars, and categories on the main sidebar.
* **Expanded by Default:** Both **Genres** (78 MAL genres & themes) and **Cluster Categories** (32 clusters) start expanded on page load.
* **Filtered "Select All":** When a user searches within Genres or Cluster Categories and clicks "Select All" or "Deselect All", toggle only the filtered/matching subset, never the full master list.
* **Header Links:** The header GitHub icon points to `https://github.com/SamPom100/MAL-Map`.

---

## 3. Build & CI Gotchas

### Cross-Directory Dependency Build Order
`svelte/src/Canvas.svelte` imports layout simulation classes directly from `../data-collection/layout.ts`. When building in CI or a fresh environment, you MUST install dependencies in `data-collection/` before building `svelte/`:

```bash
cd data-collection && npm ci
cd ../svelte && npm ci
```

Skipping `data-collection` causes TypeScript compilation in `svelte/` to fail with missing module errors for `d3-force` and `lodash`.

### Git Tracking of Data Files
Never ignore `data-collection/data/*.json` in `.gitignore`. Webpack requires `min_metadata.json`, `layout.json`, `edges.json`, and `clusters.json` to bundle successfully.

---

## 4. Development Commands

### Frontend Development
```bash
# Start frontend dev server on http://localhost:8080
cd svelte
npm run dev

# Compile production frontend bundle
cd svelte
npm run build
```

### Data Pipeline & Layout Engine
```bash
# Install data pipeline dependencies
cd data-collection
npm ci

# Set up Python clustering virtual environment (if missing)
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Run incremental anime metadata update
cd data-collection
npm run update

# Recompute full layout and clustering from scratch
cd data-collection
npm run layout
```
