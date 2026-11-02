# Changelog

All notable changes to Strategy OS are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

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
