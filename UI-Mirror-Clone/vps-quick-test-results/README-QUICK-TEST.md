# Quick test — [AndaraLab VPS](http://76.13.17.91/) (no Playwright)

**Date:** 2026-04-21  
**Method:** HTTP checks + `Invoke-RestMethod` to API + Microsoft Edge headless screenshots (PNG) + `.NET` JPEG export.

## Artifacts (JPG)

| File | Description |
|------|-------------|
| `01-home.jpg` | Homepage screenshot (Edge headless, ~1680×1050 viewport). |
| `02-data-hub.jpg` | `/data` Data Hub screenshot. |
| `05-all-datasets-api-qa.jpg` | One image listing **all 29 datasets** from `GET http://76.13.17.91:3001/api/datasets` with id, title, **unit**, unitType, row count, yAxis min/max, numeric data range, and clip flags. |

**Also saved:** `api-datasets-full.json` (full API payload), `DATASET-QA.csv` (tabular QA), source PNGs where applicable.

## API checks (Mba Dinda / chart backend)

- **Datasets:** 29  
- **yAxisMax &lt; data max (would clip the series):** **0**  
- **yAxisMin &gt; data min (would clip):** **0**  
- **Empty `unit` string:** **11** datasets (IDs below). Admin should set **Unit label** for these if a label is required on charts.

Empty-unit IDs: `ds-1776254803633-o0fg`, `ds-1776262562782-yg4s`, `ds-1776304331056-1ruh`, `ds-1776306075962-if6v`, `ds-1776338313497-rjw6`, `ds-1776339864628-1aug`, `ds-1776340614798-jn8d`, `ds-1776390476739-ynlr`, `ds-1776390914742-gpmh`, `ds-1776391168646-i9wx`, `ds-1776407366062-3tmn`.

## Frontend bundle on VPS

`index.html` references `/assets/index.1776723897929.js`. Chart UI changes (Indonesian dot format, table row order, axis label) ship with a **new** build after deploy; this test does **not** prove the browser bundle already includes that commit until you rebuild the frontend image and refresh.

## Limits of this test

- **Not** a pixel-level audit of every chart tooltip/Y tick (needs interactive browser or visual review after deploy).  
- Headless capture of `/data/economic-calendar` and `/data/market-dashboard` did not reliably produce extra PNGs in this environment; home + Data Hub + API JPG cover the main surfaces.  
- API base for the app is **`http://76.13.17.91:3001`** (see `.env.example`); path `/api/datasets` on port 80 returned 404 here.

## Regenerate

```powershell
cd vps-quick-test-results
# Re-fetch API + CSV + JSON (adjust commands from history if needed)
.\Export-QaReportImage.ps1
.\Convert-PngToJpg.ps1 -PngPath .\01-home.png -JpgPath .\01-home.jpg
.\Convert-PngToJpg.ps1 -PngPath .\02-data-hub.png -JpgPath .\02-data-hub.jpg
```
