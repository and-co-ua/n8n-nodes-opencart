import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';

export const logOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['log'],
			},
		},
		options: [
			{ name: 'Clear', value: 'clear', description: 'Empty the log', action: 'Clear a log' },
			{ name: 'Get', value: 'get', description: 'Get the last lines of the log', action: 'Get a log' },
		],
		default: 'get',
	},
];

export const logFields: INodeProperties[] = [
	{
		displayName: 'Log',
		name: 'log',
		type: 'options',
		displayOptions: { show: { resource: ['log'] } },
		options: [
			{ name: 'Error Log', value: 'error', description: 'PHP errors and warnings of the store' },
			{ name: 'OCMOD Log', value: 'ocmod', description: 'Log of the last modification refresh' },
		],
		default: 'error',
	},
	{
		displayName: 'Lines',
		name: 'lines',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 10000 },
		displayOptions: { show: { resource: ['log'], operation: ['get'] } },
		default: 100,
		description: 'How many lines to return from the end of the log',
	},
];

export function buildLogRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const log = this.getNodeParameter('log', i) as string;

	if (operation === 'clear') {
		return { action: `clear_${log}`, params: {} };
	}

	return { action: log, params: { lines: this.getNodeParameter('lines', i) } };
}
