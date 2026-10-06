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
	clearSessions: 'clear_sessions',
	clearTemplateCache: 'clear_template_cache',
};

export function buildMaintenanceRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'clearCache') {
		return { action: ACTIONS[operation], params: { key: this.getNodeParameter('key', i) } };
	}

	return { action: ACTIONS[operation], params: {} };
}
