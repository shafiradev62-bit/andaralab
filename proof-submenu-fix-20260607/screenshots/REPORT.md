# Submenu Fix — Playwright Proof

**Tested:** 2026-06-07T09:25:04.290Z
**Site:** https://andaralab.id

| # | Page | Articles | Leak markers | Result | Screenshot |
|---|------|----------|--------------|--------|------------|
| 01-macro-outlooks-empty | https://andaralab.id/macro/macro-outlooks | 0 | none | **PASS** | 01-macro-outlooks-empty.jpg |
| 02-sectoral-regional-empty | https://andaralab.id/sectoral/regional | 0 | none | **PASS** | 02-sectoral-regional-empty.jpg |
| 03-sectoral-esg-empty | https://andaralab.id/sectoral/esg | 0 | none | **PASS** | 03-sectoral-esg-empty.jpg |
| 04-sectoral-commodity-has-articles | https://andaralab.id/sectoral/commodity | 3 | none | **PASS** | 04-sectoral-commodity-has-articles.jpg |
| 05-sectoral-deep-dives-has-articles | https://andaralab.id/sectoral/deep-dives | 1 | none | **PASS** | 05-sectoral-deep-dives-has-articles.jpg |
| 06-api-hide-from-macro-outlook | https://andaralab.id/api/blog | — | none | **PASS** | 06-api-blog-schema-proof.jpg |
| 08-cms-hide-from-macro-outlook | https://andaralab.id/admin | — | none | **PASS** | 08-cms-hide-from-macro-outlook-checkbox.jpg |

**Overall:** ALL PASS

## Fix mapping

- **01-macro-outlooks-empty**: FeaturedSection no fallback + strict subcategory Macro Outlooks → verified
- **02-sectoral-regional-empty**: Strict subcategory + economics-101 blocked → verified
- **03-sectoral-esg-empty**: Strict subcategory + economics-101 blocked → verified
- **04-sectoral-commodity-has-articles**: Strict subcategory Commodity matches live posts → verified
- **05-sectoral-deep-dives-has-articles**: Strict subcategory Strategic Industry Deep-dives → verified
- **06-api-hide-from-macro-outlook**: hideFromMacroOutlook field in backend blog API schema → verified
- **08-cms-hide-from-macro-outlook**: hideFromMacroOutlook checkbox in CMS blog editor → verified