# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-06

### Added

- The credential test reports a store where the n8n API module is not activated yet
  (module 1.2.0+).
- Example workflows in `examples/` with screenshots in the README: daily sales digest, low stock
  alert, supplier price and stock sync, AI shop assistant, orders from a landing page, nightly
  maintenance.

### Fixed

- Language drop-downs showed an error for the empty default; they now offer *Store Default*
  (and Lookup → Zones offers *All Countries*).
- OpenCart Standard API credential test: a wrong key failed with "Cannot read properties of
  undefined"; it now reports a wrong key, a not allowed IP address or a wrong store URL.

## [1.0.0] - 2026-10-06

### Changed

- Published on npm as `@and-co-ua/n8n-nodes-opencart`.
- The publish workflow checks that the tag matches the `package.json` version.

## [0.10.0] - 2026-10-06

### Added

- Parameter **API**: *Full API* (the n8n API extension, default) or *Standard OpenCart API* (the
  API built into OpenCart 3) with Order → Create, Quote, Get, Change Status, Delete and the
  **OpenCart Standard API** credentials.
- OpenCart logo as the node icon.

## [0.9.0] - 2026-10-06

### Added

- Log resource: Get (the last lines of the error or OCMOD log), Clear.
- Maintenance resource: Clear Abandoned Carts, Clear Cache (by key), Clear Expired Sessions,
  Clear Template Cache.
- Image resource: Resize (URL of a resized store image).

## [0.8.0] - 2026-10-06

### Added

- Marketing Campaign resource: Create, Delete, Get, Get Many, Update.
- Coupon resource: Create, Delete, Get, Get History, Get Many (incl. Active Now), Update.
- Mail resource: Send to newsletter subscribers, all customers, a customer group, selected
  customers or affiliates, or buyers of products; all batches are sent in one node run and
  one summary item is returned.

## [0.7.0] - 2026-10-05

### Added

- Order resource: Create, Update and Quote through the store's checkout, Get, Get Many, Delete,
  Add / Get History, Create Invoice Number, Add / Remove Reward Points, Add / Remove Commission.
- Return resource: Create, Delete, Get, Get Many, Update, Add / Get History.
- Gift Voucher resource: Create, Delete, Get, Get History, Get Many, Send, Update.
- Notify Customer option for customer transactions, reward points and approvals.

## [0.6.0] - 2026-10-05

### Added

- Customer resource: Create, Update, Get, Get Many, Delete with addresses, custom fields and
  password; Add / Get History, Add / Get Transactions, Add / Get Reward Points.
- Customer Group resource with Create, Delete, Get, Get Many, Update.
- Customer Approval resource: Get Many, Approve, Deny.
- Customer picker with search (resource locator).
- Return All / Limit for history, transactions and reward points.

## [0.5.0] - 2026-10-05

### Added

- Product resource: Create, Update, Get, Get Many (filters for sync), Copy, Delete.
- Product → Bulk Update: one input item per product, matched by SKU, model or ID, sent in
  batches of 500, one result item per input item.
- Product picker with search (resource locator), also in Review → Create.
- Lookup types and drop-downs for stock statuses, length classes and weight classes.

## [0.4.0] - 2026-10-05

### Added

- Catalog resources with Create, Delete, Get, Get Many and Update: Attribute, Attribute Group,
  Category, Download (file from an input binary field), Filter Group, Information Page,
  Manufacturer, Option (with values), Review.
- Language selection for texts: one language per call, partial updates per language.
- Get Many: Return All with automatic paging, Limit, filters and sorting.
- Drop-downs loaded from the store for categories, manufacturers, attribute groups, attributes,
  options, filter groups, filters, downloads and information pages.

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
