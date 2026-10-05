import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { descriptionItem, languageField, listFields, listParams, sortOptions } from './common';

export const customerGroupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customer_group'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a customer group',
				action: 'Create a customer group',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a customer group that has no customers and is not a default',
				action: 'Delete a customer group',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a customer group with all languages',
				action: 'Get a customer group',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many customer groups',
				action: 'Get many customer groups',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a customer group',
				action: 'Update a customer group',
			},
		],
		default: 'getAll',
	},
];

const customerGroupFieldOptions: INodeProperties[] = [
	{
		displayName: 'Approve New Customers',
		name: 'approval',
		type: 'boolean',
		default: false,
		description: 'Whether new customers of the group need approval before they can log in',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Description in the selected language',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'number',
		default: 0,
	},
];

export const customerGroupFields: INodeProperties[] = [
	{
		displayName: 'Customer Group Name or ID',
		name: 'customerGroupId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getCustomerGroups' },
		displayOptions: {
			show: {
				resource: ['customer_group'],
				operation: ['get', 'delete', 'update'],
			},
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['customer_group'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language (3–32 characters). Other languages get a copy.',
	},
	languageField('customer_group', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['customer_group'],
				operation: ['create'],
			},
		},
		default: {},
		options: customerGroupFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['customer_group'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			...customerGroupFieldOptions,
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name in the selected language',
			},
		],
	},
	...listFields('customer_group'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['customer_group'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' }],
	},
	sortOptions(
		'customer_group',
		[
			{ name: 'ID', value: 'customer_group_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'name',
	),
];

export function buildCustomerGroupRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { customer_group_id: this.getNodeParameter('customerGroupId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
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
		params.customer_group_id = this.getNodeParameter('customerGroupId', i);
	}

	const description = descriptionItem.call(this, i, fields, { name: 'name', description: 'description' });

	if (description) {
		params.descriptions = [description];
	}

	if (fields.approval !== undefined) {
		params.approval = fields.approval;
	}

	if (fields.sortOrder !== undefined) {
		params.sort_order = fields.sortOrder;
	}

	return { action: operation, params };
}
