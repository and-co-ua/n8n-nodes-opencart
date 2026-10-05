import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import {
	descriptionItem,
	languageField,
	listFields,
	listParams,
	seoUrlItem,
	sortOptions,
} from './common';

export const informationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['information'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create an information page',
				action: 'Create an information page',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an information page that the store settings do not use',
				action: 'Delete an information page',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an information page with all languages',
				action: 'Get an information page',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many information pages',
				action: 'Get many information pages',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an information page',
				action: 'Update an information page',
			},
		],
		default: 'getAll',
	},
];

const informationFieldOptions: INodeProperties[] = [
	{
		displayName: 'Meta Description',
		name: 'metaDescription',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Meta Keywords',
		name: 'metaKeyword',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Meta Title',
		name: 'metaTitle',
		type: 'string',
		default: '',
		description: 'Defaults to the title when a page is created',
	},
	{
		displayName: 'SEO Keyword',
		name: 'seoKeyword',
		type: 'string',
		default: '',
		description:
			'SEO URL keyword for the selected language in the default store. Empty removes it.',
	},
	{
		displayName: 'Show in Footer',
		name: 'bottom',
		type: 'boolean',
		default: false,
		description: 'Whether to link the page in the store footer',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'number',
		default: 0,
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'boolean',
		default: true,
		description: 'Whether the page is enabled',
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

export const informationFields: INodeProperties[] = [
	{
		displayName: 'Information Page Name or ID',
		name: 'informationId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getInformationPages' },
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['get', 'delete', 'update'],
			},
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Title in the selected language. Other languages get a copy until translated.',
	},
	{
		displayName: 'Content',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 6 },
		required: true,
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'HTML content of the page (at least 3 characters)',
	},
	languageField('information', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['create'],
			},
		},
		default: {},
		options: informationFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Content',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 6 },
				default: '',
				description: 'HTML content in the selected language',
			},
			...informationFieldOptions,
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title in the selected language',
			},
		],
	},
	...listFields('information'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['information'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) pages',
			},
			{ displayName: 'Title Contains', name: 'title', type: 'string', default: '' },
		],
	},
	sortOptions(
		'information',
		[
			{ name: 'ID', value: 'information_id' },
			{ name: 'Sort Order', value: 'sort_order' },
			{ name: 'Title', value: 'title' },
		],
		'title',
	),
];

const DESCRIPTION_FIELDS = {
	title: 'title',
	description: 'description',
	metaTitle: 'meta_title',
	metaDescription: 'meta_description',
	metaKeyword: 'meta_keyword',
};

export function buildInformationRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { information_id: this.getNodeParameter('informationId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.title) {
			params.filter_title = filters.title;
		}

		if (filters.status !== undefined) {
			params.filter_status = filters.status;
		}

		return { action: 'list', params, list: true };
	}

	const fields =
		operation === 'create'
			? {
					...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
					title: this.getNodeParameter('title', i),
					description: this.getNodeParameter('description', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);

	const params: IDataObject = {};

	if (operation === 'update') {
		params.information_id = this.getNodeParameter('informationId', i);
	}

	const description = descriptionItem.call(this, i, fields, DESCRIPTION_FIELDS);

	if (description) {
		params.descriptions = [description];
	}

	const map: Record<string, string> = {
		bottom: 'bottom',
		sortOrder: 'sort_order',
		status: 'status',
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
