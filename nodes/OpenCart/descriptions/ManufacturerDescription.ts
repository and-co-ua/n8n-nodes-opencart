import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { listFields, listParams, seoUrlItem, sortOptions } from './common';

export const manufacturerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['manufacturer'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a manufacturer',
				action: 'Create a manufacturer',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a manufacturer that has no products',
				action: 'Delete a manufacturer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a manufacturer',
				action: 'Get a manufacturer',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many manufacturers',
				action: 'Get many manufacturers',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a manufacturer',
				action: 'Update a manufacturer',
			},
		],
		default: 'getAll',
	},
];

const manufacturerFieldOptions: INodeProperties[] = [
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: '',
		placeholder: 'catalog/demo/apple_logo.jpg',
		description: 'Image path relative to the image/ directory of the store',
	},
	{
		displayName: 'SEO Keyword',
		name: 'seoKeyword',
		type: 'string',
		default: '',
		description:
			'SEO URL keyword for the store default language in the default store. Empty removes it.',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'number',
		default: 0,
	},
	{
		displayName: 'Store Names or IDs',
		name: 'storeIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getStores' },
		default: [],
		description:
			'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
];

export const manufacturerFields: INodeProperties[] = [
	{
		displayName: 'Manufacturer Name or ID',
		name: 'manufacturerId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getManufacturers' },
		displayOptions: {
			show: {
				resource: ['manufacturer'],
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
				resource: ['manufacturer'],
				operation: ['create'],
			},
		},
		default: '',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['manufacturer'],
				operation: ['create'],
			},
		},
		default: {},
		options: manufacturerFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['manufacturer'],
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
			},
			...manufacturerFieldOptions,
		],
	},
	...listFields('manufacturer'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['manufacturer'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Name Contains',
				name: 'name',
				type: 'string',
				default: '',
			},
		],
	},
	sortOptions(
		'manufacturer',
		[
			{ name: 'ID', value: 'manufacturer_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'name',
	),
];

export function buildManufacturerRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { manufacturer_id: this.getNodeParameter('manufacturerId', i) } };
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
		params.manufacturer_id = this.getNodeParameter('manufacturerId', i);
	}

	const map: Record<string, string> = {
		name: 'name',
		image: 'image',
		sortOrder: 'sort_order',
		storeIds: 'stores',
	};

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined) {
			params[apiName] = fields[nodeName];
		}
	}

	const seoUrls = seoUrlItem.call(this, i, fields.seoKeyword);

	if (seoUrls) {
		params.seo_urls = seoUrls;
	}

	return { action: operation, params };
}
