# n8n-nodes-opencart

This is an n8n community node. It lets you manage an [OpenCart](https://www.opencart.com/) 3
store in your n8n workflows: catalog, customers, orders, returns, gift vouchers, marketing
and maintenance tasks.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/)
workflow automation platform.

> **Status:** early development (0.x). Operations are not available yet.

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

Planned: lookups (languages, stores, currencies, statuses, countries, zones, …), categories,
manufacturers, attributes, options, filters, downloads, reviews, information pages,
customers and customer groups, customer approvals, orders, returns, gift vouchers,
marketing campaigns, coupons, mailing, logs and maintenance tasks.

## Credentials

Available from version 0.2.0: store URL, API key and the way the key is sent
(header, bearer token, request body or query string — for hosts that strip headers).

## Compatibility

- OpenCart 3.0.3.x – 3.0.5.1 with the n8n API extension installed.
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
