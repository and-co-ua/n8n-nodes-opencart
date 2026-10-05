import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { languageField, listFields, listParams, sortOptions, toApiDate } from './common';

export const returnOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['return'],
			},
		},
		options: [
			{
				name: 'Add History',
				value: 'addHistory',
				description: 'Change the return status, optionally e-mailing the customer',
				action: 'Change the status of a return',
			},
			{ name: 'Create', value: 'create', description: 'Create a return', action: 'Create a return' },
			{ name: 'Delete', value: 'delete', description: 'Delete a return', action: 'Delete a return' },
			{ name: 'Get', value: 'get', description: 'Get a return with its history', action: 'Get a return' },
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get the status history of a return',
				action: 'Get the history of a return',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many returns', action: 'Get many returns' },
			{ name: 'Update', value: 'update', description: 'Update a return', action: 'Update a return' },
		],
		default: 'getAll',
	},
];

const ID_PICKER = (displayName: string, name: string, method: string): INodeProperties => ({
	displayName,
	name,
	type: 'options',
	typeOptions: { loadOptionsMethod: method },
	default: '',
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
});

const returnFieldOptions: INodeProperties[] = [
	{ displayName: 'Comment', name: 'comment', type: 'string', typeOptions: { rows: 3 }, default: '' },
	{ displayName: 'Customer ID', name: 'customerId', type: 'number', default: 0 },
	{ displayName: 'Date Ordered', name: 'dateOrdered', type: 'dateTime', default: '' },
	{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
	{ displayName: 'First Name', name: 'firstname', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'lastname', type: 'string', default: '' },
	{ displayName: 'Model', name: 'model', type: 'string', default: '' },
	{
		displayName: 'Opened',
		name: 'opened',
		type: 'boolean',
		default: false,
		description: 'Whether the product has been opened',
	},
	{ displayName: 'Product Name', name: 'product', type: 'string', default: '' },
	{ displayName: 'Quantity', name: 'quantity', type: 'number', typeOptions: { minValue: 1 }, default: 1 },
	ID_PICKER('Return Action Name or ID', 'returnActionId', 'getReturnActions'),
	ID_PICKER('Return Reason Name or ID', 'returnReasonId', 'getReturnReasons'),
	{ displayName: 'Telephone', name: 'telephone', type: 'string', default: '' },
];

export const returnFields: INodeProperties[] = [
	{
		displayName: 'Return ID',
		name: 'returnId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['get', 'delete', 'update', 'addHistory', 'getHistory'],
			},
		},
		default: 0,
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['create'],
			},
		},
		default: 0,
		description: 'Customer data and the order date are taken from the order unless given',
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['create'],
			},
		},
		default: 0,
		description: 'Product of the order; its name, model and quantity are taken from the order unless given',
	},
	{
		...ID_PICKER('Return Reason Name or ID', 'returnReasonId', 'getReturnReasons'),
		required: true,
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			...returnFieldOptions.filter((field) => field.name !== 'returnReasonId'),
			ID_PICKER('Return Status Name or ID', 'returnStatusId', 'getReturnStatuses'),
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['update'],
			},
		},
		default: {},
		options: [...returnFieldOptions, { displayName: 'Order ID', name: 'orderId', type: 'number', default: 0 }, { displayName: 'Product ID', name: 'productId', type: 'number', default: 0 }],
	},
	{
		...ID_PICKER('Return Status Name or ID', 'returnStatusId', 'getReturnStatuses'),
		required: true,
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['addHistory'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'historyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['addHistory'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Comment', name: 'comment', type: 'string', typeOptions: { rows: 3 }, default: '' },
			{
				displayName: 'Notify Customer',
				name: 'notify',
				type: 'boolean',
				default: false,
				description: 'Whether to e-mail the customer about the new status',
			},
		],
	},
	languageField('return', ['get', 'getAll', 'getHistory']),
	...listFields('return', ['getAll', 'getHistory']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['return'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Customer ID', name: 'customerId', type: 'number', default: 0 },
			{ displayName: 'Customer Name Contains', name: 'customer', type: 'string', default: '' },
			{ displayName: 'Date Added From', name: 'dateAddedFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Added To', name: 'dateAddedTo', type: 'dateTime', default: '' },
			{ displayName: 'Date Modified From', name: 'dateModifiedFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Modified To', name: 'dateModifiedTo', type: 'dateTime', default: '' },
			{ displayName: 'Model Contains', name: 'model', type: 'string', default: '' },
			{ displayName: 'Order ID', name: 'orderId', type: 'number', default: 0 },
			{ displayName: 'Product ID', name: 'productId', type: 'number', default: 0 },
			{ displayName: 'Product Name Contains', name: 'product', type: 'string', default: '' },
			ID_PICKER('Return Status Name or ID', 'returnStatusId', 'getReturnStatuses'),
		],
	},
	sortOptions(
		'return',
		[
			{ name: 'Customer', value: 'customer' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Date Modified', value: 'date_modified' },
			{ name: 'ID', value: 'return_id' },
			{ name: 'Model', value: 'model' },
			{ name: 'Order ID', value: 'order_id' },
			{ name: 'Product', value: 'product' },
			{ name: 'Status', value: 'return_status' },
		],
		'return_id',
	),
];

const FIELD_MAP: Record<string, string> = {
	orderId: 'order_id',
	productId: 'product_id',
	customerId: 'customer_id',
	firstname: 'firstname',
	lastname: 'lastname',
	email: 'email',
	telephone: 'telephone',
	product: 'product',
	model: 'model',
	quantity: 'quantity',
	opened: 'opened',
	returnReasonId: 'return_reason_id',
	returnActionId: 'return_action_id',
	returnStatusId: 'return_status_id',
	comment: 'comment',
};

export function buildReturnRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const returnId = () => this.getNodeParameter('returnId', i);
	const languageId = this.getNodeParameter('languageId', i, '') as string | number;

	switch (operation) {
		case 'get':
		case 'delete': {
			const params: IDataObject = { return_id: returnId() };

			if (operation === 'get' && languageId !== '') {
				params.language_id = languageId;
			}

			return { action: operation, params };
		}

		case 'getHistory': {
			const params = listParams.call(this, i);

			params.return_id = returnId();

			return { action: 'history', params, list: true };
		}

		case 'addHistory': {
			const options = this.getNodeParameter('historyOptions', i, {}) as IDataObject;

			return {
				action: 'add_history',
				params: {
					return_id: returnId(),
					return_status_id: this.getNodeParameter('returnStatusId', i),
					comment: options.comment ?? '',
					notify: options.notify ?? false,
				},
			};
		}

		case 'getAll': {
			const params = listParams.call(this, i);
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const map: Record<string, string> = {
				orderId: 'filter_order_id',
				customerId: 'filter_customer_id',
				productId: 'filter_product_id',
				returnStatusId: 'filter_return_status_id',
				customer: 'filter_customer',
				product: 'filter_product',
				model: 'filter_model',
			};

			for (const [nodeName, apiName] of Object.entries(map)) {
				if (filters[nodeName] !== undefined && filters[nodeName] !== '') {
					params[apiName] = filters[nodeName];
				}
			}

			const dates: Record<string, string> = {
				dateAddedFrom: 'filter_date_added_from',
				dateAddedTo: 'filter_date_added_to',
				dateModifiedFrom: 'filter_date_modified_from',
				dateModifiedTo: 'filter_date_modified_to',
			};

			for (const [nodeName, apiName] of Object.entries(dates)) {
				if (filters[nodeName]) {
					params[apiName] = toApiDate(filters[nodeName], apiName.endsWith('_to'));
				}
			}

			return { action: 'list', params, list: true };
		}

		default: {
			const fields =
				operation === 'create'
					? {
							...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
							orderId: this.getNodeParameter('orderId', i),
							productId: this.getNodeParameter('productId', i, 0),
							returnReasonId: this.getNodeParameter('returnReasonId', i),
						}
					: (this.getNodeParameter('updateFields', i, {}) as IDataObject);
			const params: IDataObject = {};

			if (operation === 'update') {
				params.return_id = returnId();
			}

			for (const [nodeName, apiName] of Object.entries(FIELD_MAP)) {
				if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
					params[apiName] = fields[nodeName];
				}
			}

			if (fields.dateOrdered) {
				params.date_ordered = toApiDate(fields.dateOrdered);
			}

			return { action: operation, params };
		}
	}
}
