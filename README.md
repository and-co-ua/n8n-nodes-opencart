# n8n-nodes-opencart

This is an n8n community node. It lets you manage an [OpenCart](https://www.opencart.com/) 3
store in your n8n workflows: catalog, customers, orders, returns, gift vouchers, marketing
and maintenance tasks.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/)
workflow automation platform.

> **Status:** early development (0.x). Only the connection check is available yet.

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
| System | Ping | Check the connection; returns API and module versions, OpenCart and PHP versions, access mode, the way the key was received, store name and server time. |

Planned: lookups (languages, stores, currencies, statuses, countries, zones, …), categories,
manufacturers, attributes, options, filters, downloads, reviews, information pages,
customers and customer groups, customer approvals, orders, returns, gift vouchers,
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

- OpenCart 3.0.3.x – 3.0.5.1 with the n8n API extension installed (API version 1, module 0.2.0+).
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
