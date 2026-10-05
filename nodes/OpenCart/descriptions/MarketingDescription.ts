import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { listFields, listParams, sortOptions, toApiDate } from './common';

export const marketingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['marketing'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a marketing campaign with a tracking code',
				action: 'Create a marketing campaign',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a marketing campaign',
				action: 'Delete a marketing campaign',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a campaign with clicks and orders',
				action: 'Get a marketing campaign',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many marketing campaigns',
				action: 'Get many marketing campaigns',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a marketing campaign',
				action: 'Update a marketing campaign',
			},
		],
		default: 'getAll',
	},
];

const CODE: INodeProperties = {
	displayName: 'Tracking Code',
	name: 'code',
	type: 'string',
	default: '',
	description: 'Unique code used as ?tracking=CODE. Generated on create when empty.',
};

const DESCRIPTION: INodeProperties = {
	displayName: 'Description',
	name: 'description',
	type: 'string',
	typeOptions: { rows: 3 },
	default: '',
};

export const marketingFields: INodeProperties[] = [
	{
		displayName: 'Marketing ID',
		name: 'marketingId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['marketing'],
				operation: ['get', 'delete', 'update'],
			},
		},
		default: 0,
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['marketing'],
				operation: ['create'],
			},
		},
		default: '',
		description: '1–32 characters',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['marketing'],
				operation: ['create'],
			},
		},
		default: {},
		options: [DESCRIPTION, CODE],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['marketing'],
				operation: ['update'],
			},
		},
		default: {},
		options: [DESCRIPTION, { displayName: 'Name', name: 'name', type: 'string', default: '' }, CODE],
	},
	...listFields('marketing'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['marketing'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Date Added From', name: 'dateFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Added To', name: 'dateTo', type: 'dateTime', default: '' },
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{ displayName: 'Tracking Code', name: 'code', type: 'string', default: '' },
		],
	},
	sortOptions(
		'marketing',
		[
			{ name: 'Code', value: 'code' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'ID', value: 'marketing_id' },
			{ name: 'Name', value: 'name' },
		],
		'name',
	),
];

export function buildMarketingRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { marketing_id: this.getNodeParameter('marketingId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
		}

		if (filters.code) {
			params.filter_code = filters.code;
		}

		if (filters.dateFrom) {
			params.filter_date_added_from = toApiDate(filters.dateFrom);
		}

		if (filters.dateTo) {
			params.filter_date_added_to = toApiDate(filters.dateTo, true);
		}

		return { action: 'list', params, list: true };
	}

	const fields =
		operation === 'create'
			? {
					...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
					name: this.getNodeParameter('name', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);
	const params: IDataObject = {};

	if (operation === 'update') {
		params.marketing_id = this.getNodeParameter('marketingId', i);
	}

	for (const field of ['name', 'description', 'code']) {
		if (fields[field] !== undefined && fields[field] !== '') {
			params[field] = fields[field];
		}
	}

	return { action: operation, params };
}
