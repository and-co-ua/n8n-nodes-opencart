import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';

export const systemOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['system'],
			},
		},
		options: [
			{
				name: 'Ping',
				value: 'ping',
				description: 'Check the connection and get store and module information',
				action: 'Ping the store',
			},
		],
		default: 'ping',
	},
];

export const systemFields: INodeProperties[] = [];

export function buildSystemRequest(this: IExecuteFunctions, operation: string): ApiCall {
	return { action: operation, params: {} };
}
