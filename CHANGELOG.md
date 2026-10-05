# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-10-05

### Added

- Lookup → Get Many: countries, currencies, customer groups, languages, layouts, order
  statuses, return actions, return reasons, return statuses, stores, tax classes, voucher
  themes, zones; optional country (zones) and language (translated lists).
- Drop-down options loaded from the store for all reference lists.

## [0.2.0] - 2026-10-05

### Added

- OpenCart API credentials: store URL, API key, the way the key is sent (`X-Api-Key`,
  Bearer token, body field, query string), endpoint route; credential test via `system.ping`.
- System → Ping operation.
- Readable errors: API error code and HTTP status, hints for non-JSON responses,
  a check of the store's API version.

## [0.1.0] - 2026-10-05

### Added

- Package scaffold generated with `@n8n/node-cli`.
- `OpenCart` node skeleton with icons and codex metadata.
- README, agent guide, changelog and MIT license.
