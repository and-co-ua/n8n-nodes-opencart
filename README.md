# n8n-nodes-opencart

This is an n8n community node. It lets you manage an [OpenCart](https://www.opencart.com/) 3
store in your n8n workflows: catalog, customers, orders, returns, gift vouchers, marketing
and maintenance tasks.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/)
workflow automation platform.

> **Status:** early development (0.x). Available: products, catalog, customers, reference lists, connection check.

[Installation](#installation) ·
[Operations](#operations) ·
[Credentials](#credentials) ·
[Compatibility](#compatibility) ·
[Development](#development) ·
[Resources](#resources)

## Installation

1. Install the **n8n API** extension in your OpenCart store and configure an API key.
2. Install this package in n8n — follow the
   [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Operations

| Resource | Operation | Description |
|---|---|---|
| Attribute | Create, Delete, Get, Get Many, Update | Product attributes (e.g. "Diagonal") within attribute groups. |
| Attribute Group | Create, Delete, Get, Get Many, Update | Groups of attributes (e.g. "Display"). |
| Category | Create, Delete, Get, Get Many, Update | Categories with parent, description, meta tags, SEO keyword, stores, filters, top menu settings. Delete also removes subcategories. |
| Customer | Create, Delete, Get, Get Many, Update, Add / Get History, Add / Get Transactions, Add / Get Reward Points | Customers with addresses, custom fields, password (works for the storefront login; random when not set), store credit and reward points with balances. |
| Customer Approval | Approve, Deny, Get Many | Pending new customers and affiliates (no e-mail is sent). |
| Customer Group | Create, Delete, Get, Get Many, Update | Customer groups with approval setting. |
| Download | Create, Delete, Get, Get Many, Update | Downloadable files for products; the file is uploaded from an input binary field. |
| Filter Group | Create, Delete, Get, Get Many, Update | Filter groups with their filters (layered navigation). |
| Information Page | Create, Delete, Get, Get Many, Update | Pages like About Us or Delivery, with footer link, meta tags and SEO keyword. |
| Manufacturer | Create, Delete, Get, Get Many, Update | Brands with image, SEO keyword and stores. |
| Option | Create, Delete, Get, Get Many, Update | Product options (select, radio, checkbox, text, date, …) with their values. |
| Product | Bulk Update, Copy, Create, Delete, Get, Get Many, Update | Products with prices, stock, descriptions, categories, attributes, options, discounts, specials, rewards, images (paths of existing files), related products and SEO keyword. Get Many filters for synchronisation: exact model / SKU, modified since, stock and price ranges, category with subcategories. |
| Review | Create, Delete, Get, Get Many, Update | Product reviews; filter by product, author, status and date, publish or edit them. |
| Lookup | Get Many | Reference lists: countries, currencies, customer groups, languages, layouts, order statuses, return actions, return reasons, return statuses, stores, tax classes, voucher themes, zones (optionally of one country). Translated lists accept a language. |
| System | Ping | Check the connection; returns API and module versions, OpenCart and PHP versions, access mode, the way the key was received, store name and server time. |

Drop-downs for languages, countries, zones, statuses, categories, manufacturers and other
reference data are loaded from the store.

**Bulk Update** (Product) treats every input item as one product: choose how items are
matched (SKU, model or product ID), map the match value and the fields to update (price,
quantity, status, stock status, …) with expressions. The node sends the items in batches of
500 and outputs one item per input item with `success` and, on failure, `error` — failed items
do not stop the others. Typical use: price and stock sync from a spreadsheet or an ERP.

**Product options** are set as JSON in the format of the API (see the module's `docs/API.md`):

```json
[{ "option_id": 5, "required": true,
   "values": [{ "option_value_id": 39, "quantity": 10, "price": 2, "price_prefix": "+" }] }]
```

**Languages.** Texts (names, descriptions, meta tags, SEO keywords) are written in the
language selected in the node (the store default when empty). A new record gets a copy of the
text in all other languages until it is translated; an update changes only the selected
language and only the fields you set.

Planned: orders, returns, gift vouchers,
marketing campaigns, coupons, mailing, logs and maintenance tasks.

## Credentials

Create **OpenCart API** credentials:

| Field | Description |
|---|---|
| Store URL | Storefront URL without `index.php`, e.g. `https://shop.example.com`. |
| API Key | From **Extensions → Extensions → Modules → n8n API** in the OpenCart admin panel. |
| Send API Key As | `X-Api-Key` header (default), Bearer token, request body field, or query string. Switch only if your host strips headers; the query string must be enabled in the module settings. |
| Endpoint Route | `api/n8n` (default, works in maintenance mode) or `extension/module/n8n_api` if the `n8n_api` event is disabled in the store. |

The credential test calls **System → Ping**.

Errors returned by the store keep their HTTP status and show the API error code
(e.g. `invalid_api_key`, `read_only_mode`). A non-JSON response (wrong URL, module not
installed, disabled event) is reported with a hint on what to check.

## Compatibility

- OpenCart 3.0.3.x – 3.0.5.1 with the n8n API extension installed (API version 1, module 0.6.0+).
- Tested with the latest n8n release.

## Development

```bash
npm install
npm run lint
npm run build
npm run dev     # starts n8n with this node on http://localhost:5678
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [OpenCart documentation](https://docs.opencart.com/)

## License

[MIT](LICENSE)
