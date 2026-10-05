import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { descriptionItem, languageField, listFields, listParams, sortOptions } from './common';

export const filterGroupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['filter_group'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a filter group with filters',
				action: 'Create a filter group',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a filter group and unlink its filters from products and categories',
				action: 'Delete a filter group',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a filter group with its filters and all languages',
				action: 'Get a filter group',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many filter groups',
				action: 'Get many filter groups',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a filter group',
				action: 'Update a filter group',
			},
		],
		default: 'getAll',
	},
];

export const filterGroupFields: INodeProperties[] = [
	{
		displayName: 'Filter Group Name or ID',
		name: 'filterGroupId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getFilterGroups' },
		displayOptions: {
			show: {
				resource: ['filter_group'],
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
				resource: ['filter_group'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language. Other languages get a copy until translated.',
	},
	languageField('filter_group', ['create', 'update', 'getAll']),
	{
		displayName: 'Filters',
		name: 'filterItems',
		type: 'fixedCollection',
		placeholder: 'Add Filter',
		typeOptions: { multipleValues: true, sortable: true },
		displayOptions: {
			show: {
				resource: ['filter_group'],
				operation: ['create', 'update'],
			},
		},
		default: {},
		description:
			'Filters of the group. On update the list replaces the current filters: give the Filter ID to keep an existing filter, filters left out are removed and unlinked from products and categories.',
		options: [
			{
				displayName: 'Filter',
				name: 'filter',
				values: [
					{
						displayName: 'Filter ID',
						name: 'filterId',
						type: 'number',
						default: 0,
						description: 'ID of an existing filter to keep (update only); 0 adds a new filter',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description:
							'Name in the selected language. Required for new filters; empty keeps the name of an existing filter.',
					},
					{
						displayName: 'Sort Order',
						name: 'sortOrder',
						type: 'number',
						default: 0,
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['filter_group'],
				operation: ['create'],
			},
		},
		default: {},
		options: [{ displayName: 'Sort Order', name: 'sortOrder', type: 'number', default: 0 }],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['filter_group'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name in the selected language',
			},
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'number', default: 0 },
		],
	},
	...listFields('filter_group'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['filter_group'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' }],
	},
	sortOptions(
		'filter_group',
		[
			{ name: 'ID', value: 'filter_group_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'name',
	),
];

export function buildFilterGroupRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { filter_group_id: this.getNodeParameter('filterGroupId', i) } };
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
		params.filter_group_id = this.getNodeParameter('filterGroupId', i);
	}

	const description = descriptionItem.call(this, i, fields, { name: 'name' });

	if (description) {
		params.descriptions = [description];
	}

	if (fields.sortOrder !== undefined) {
		params.sort_order = fields.sortOrder;
	}

	const items = (this.getNodeParameter('filterItems', i, {}) as IDataObject).filter as
		| IDataObject[]
		| undefined;

	// On update an untouched Filters field keeps the current filters
	if (items !== undefined || operation === 'create') {
		params.filters = (items ?? []).map((filter) => {
			const item: IDataObject = { sort_order: filter.sortOrder };
			const name = descriptionItem.call(this, i, filter.name ? { name: filter.name } : {}, { name: 'name' });

			if (filter.filterId) {
				item.filter_id = filter.filterId;
			}

			if (name) {
				item.descriptions = [name];
			}

			return item;
		});
	}

	return { action: operation, params };
}
