import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { listFields, listParams, sortOptions } from './common';

export const voucherOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['voucher'],
			},
		},
		options: [
			{ name: 'Create', value: 'create', description: 'Create a gift voucher', action: 'Create a gift voucher' },
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a gift voucher not bought in an order',
				action: 'Delete a gift voucher',
			},
			{ name: 'Get', value: 'get', description: 'Get a gift voucher', action: 'Get a gift voucher' },
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get the orders the voucher was used in',
				action: 'Get the history of a gift voucher',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many gift vouchers',
				action: 'Get many gift vouchers',
			},
			{
				name: 'Send',
				value: 'send',
				description: 'E-mail the gift voucher to the recipient',
				action: 'Send a gift voucher',
			},
			{ name: 'Update', value: 'update', description: 'Update a gift voucher', action: 'Update a gift voucher' },
		],
		default: 'getAll',
	},
];

const THEME: INodeProperties = {
	displayName: 'Theme Name or ID',
	name: 'voucherThemeId',
	type: 'options',
	typeOptions: { loadOptionsMethod: 'getVoucherThemes' },
	default: '',
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

const voucherFieldOptions: INodeProperties[] = [
	{
		displayName: 'Code',
		name: 'code',
		type: 'string',
		default: '',
		description: '3–10 characters, unique. Generated on create when empty.',
	},
	{ displayName: 'Message', name: 'message', type: 'string', typeOptions: { rows: 3 }, default: '' },
	{
		displayName: 'Status',
		name: 'status',
		type: 'boolean',
		default: true,
		description: 'Whether the voucher can be used',
	},
];

const REQUIRED: Array<[string, string, string]> = [
	['From Name', 'fromName', 'from_name'],
	['From Email', 'fromEmail', 'from_email'],
	['To Name', 'toName', 'to_name'],
	['To Email', 'toEmail', 'to_email'],
];

export const voucherFields: INodeProperties[] = [
	{
		displayName: 'Voucher ID',
		name: 'voucherId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['get', 'delete', 'update', 'getHistory', 'send'],
			},
		},
		default: 0,
	},
	...REQUIRED.map(
		([displayName, name]): INodeProperties => ({
			displayName,
			name,
			type: 'string',
			required: true,
			placeholder: name.endsWith('Email') ? 'name@email.com' : undefined,
			displayOptions: {
				show: {
					resource: ['voucher'],
					operation: ['create'],
				},
			},
			default: '',
		}),
	),
	{
		...THEME,
		required: true,
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['create'],
			},
		},
		default: 10,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['create'],
			},
		},
		default: {},
		options: voucherFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Amount', name: 'amount', type: 'number', typeOptions: { minValue: 1 }, default: 10 },
			...voucherFieldOptions,
			...REQUIRED.map(
				([displayName, name]): INodeProperties => ({
					displayName,
					name,
					type: 'string',
					placeholder: name.endsWith('Email') ? 'name@email.com' : undefined,
					default: '',
				}),
			),
			THEME,
		],
	},
	...listFields('voucher', ['getAll', 'getHistory']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['voucher'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Code', name: 'code', type: 'string', default: '' },
			{ displayName: 'From Contains', name: 'from', type: 'string', default: '', description: 'Name or e-mail' },
			{ displayName: 'Order ID', name: 'orderId', type: 'number', default: 0 },
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) vouchers',
			},
			{ displayName: 'To Contains', name: 'to', type: 'string', default: '', description: 'Name or e-mail' },
		],
	},
	sortOptions(
		'voucher',
		[
			{ name: 'Amount', value: 'amount' },
			{ name: 'Code', value: 'code' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'From Name', value: 'from_name' },
			{ name: 'ID', value: 'voucher_id' },
			{ name: 'Status', value: 'status' },
			{ name: 'To Name', value: 'to_name' },
		],
		'date_added',
	),
];

export function buildVoucherRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const voucherId = () => this.getNodeParameter('voucherId', i);

	if (operation === 'get' || operation === 'delete' || operation === 'send') {
		return { action: operation, params: { voucher_id: voucherId() } };
	}

	if (operation === 'getHistory') {
		return { action: 'history', params: { voucher_id: voucherId() }, list: true };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const map: Record<string, string> = {
			code: 'filter_code',
			from: 'filter_from',
			to: 'filter_to',
			orderId: 'filter_order_id',
			status: 'filter_status',
		};

		for (const [nodeName, apiName] of Object.entries(map)) {
			if (filters[nodeName] !== undefined && filters[nodeName] !== '') {
				params[apiName] = filters[nodeName];
			}
		}

		return { action: 'list', params, list: true };
	}

	const fields =
		operation === 'create'
			? {
					...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
					fromName: this.getNodeParameter('fromName', i),
					fromEmail: this.getNodeParameter('fromEmail', i),
					toName: this.getNodeParameter('toName', i),
					toEmail: this.getNodeParameter('toEmail', i),
					voucherThemeId: this.getNodeParameter('voucherThemeId', i),
					amount: this.getNodeParameter('amount', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);
	const params: IDataObject = {};

	if (operation === 'update') {
		params.voucher_id = voucherId();
	}

	const map: Record<string, string> = {
		code: 'code',
		message: 'message',
		status: 'status',
		amount: 'amount',
		voucherThemeId: 'voucher_theme_id',
	};

	for (const [, name, apiName] of REQUIRED) {
		map[name] = apiName;
	}

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			params[apiName] = fields[nodeName];
		}
	}

	return { action: operation, params };
}
