import type { INodeProperties } from 'n8n-workflow';

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
