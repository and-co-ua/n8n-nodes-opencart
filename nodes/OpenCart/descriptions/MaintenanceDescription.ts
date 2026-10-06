import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';

export const maintenanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['maintenance'],
			},
		},
		options: [
			{
				name: 'Clear Abandoned Carts',
				value: 'clearCarts',
				description: 'Delete carts of customers not changed for a number of days',
				action: 'Clear abandoned carts',
			},
			{
				name: 'Clear Cache',
				value: 'clearCache',
				description: 'Delete a key of the system cache',
				action: 'Clear the system cache',
			},
			{
				name: 'Clear Expired Sessions',
				value: 'clearSessions',
				description: 'Delete expired sessions from the database',
				action: 'Clear expired sessions',
			},
			{
				name: 'Clear Template Cache',
				value: 'clearTemplateCache',
				description: 'Delete compiled Twig templates',
				action: 'Clear the template cache',
			},
		],
		default: 'clearCache',
	},
];

export const maintenanceFields: INodeProperties[] = [
	{
		displayName: 'Older Than (Days)',
		name: 'days',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1, maxValue: 3650 },
		displayOptions: { show: { resource: ['maintenance'], operation: ['clearCarts'] } },
		default: 30,
		description:
			'Delete the whole cart of a customer whose newest cart item is older than this. Guest carts older than an hour are deleted too.',
	},
	{
		displayName: 'Cache Key',
		name: 'key',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['maintenance'], operation: ['clearCache'] } },
		default: '',
		placeholder: 'product',
		description:
			'Key as the admin panel uses it, e.g. product, category, currency. With the default file cache the key is a prefix (product clears all product.* entries); * clears the whole cache on OpenCart 3.0.4.0+.',
	},
];

const ACTIONS: Record<string, string> = {
	clearCache: 'clear_cache',
	clearCarts: 'clear_carts',
	clearSessions: 'clear_sessions',
	clearTemplateCache: 'clear_template_cache',
};

export function buildMaintenanceRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'clearCache') {
		return { action: ACTIONS[operation], params: { key: this.getNodeParameter('key', i) } };
	}

	if (operation === 'clearCarts') {
		return { action: ACTIONS[operation], params: { days: this.getNodeParameter('days', i) } };
	}

	return { action: ACTIONS[operation], params: {} };
}
