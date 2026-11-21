# Changelog

All notable changes to Strategy OS are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- `tests/api.test.js`: HTTP API smoke tests. `npm test` now starts the real server on a free local port with a throwaway SQLite file and checks health, state, initiative creation and validation (422), 404 routes, CSV export and that files outside `public/` are never served. The developer database in `data/` is never touched.


### Fixed
- A malformed JSON request body now returns `400 Invalid JSON` instead of a `500` server error.
- A JSON body that is not an object (`null`, an array, a string or a number) now returns `400 JSON body must be an object`: `null` used to crash with a `500`, and the others were silently accepted as an empty profile or initiative update.
- A URL with malformed percent-encoding (for example `/%E0%A4%A`) now returns `400` instead of a `500 URI malformed`.

### Security
- CSV export (`/api/export?format=csv`) neutralises spreadsheet formula injection: text cells starting with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with `'` so Excel, LibreOffice or Google Sheets never run them as formulas. Numbers stay untouched; carriage returns are now quoted too.

## [1.1.0] - 2026-11-02

### Added
- `launch-strategy-os.sh`: one-command launcher for macOS and Linux, on par with the Windows `launch-strategy-os.ps1` (checks Node.js, starts the server, opens the browser).
- This changelog.

### Fixed
- `npm test` now runs on every supported Node.js version (22.5+): the unsupported `--test-isolation` flag was removed.

### Changed
- Product and repository identity unified under the Strategy OS name.

## [1.0.0] - 2026-09-22

### Added
- First public version: strategy design, execution tracking, value attribution and ROI proof in a local-first PWA backed by SQLite.
- Methodology and architecture docs, product screenshots, Windows launcher.

[1.1.0]: https://github.com/abbas-mistrah/strategy-os/releases/tag/v1.1.0
[1.0.0]: https://github.com/abbas-mistrah/strategy-os/commit/7a45b5f
