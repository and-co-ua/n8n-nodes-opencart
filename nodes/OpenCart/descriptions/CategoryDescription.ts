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

export const categoryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['category'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a category',
				action: 'Create a category',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a category with all its subcategories',
				action: 'Delete a category',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a category with all languages',
				action: 'Get a category',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many categories',
				action: 'Get many categories',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a category',
				action: 'Update a category',
			},
		],
		default: 'getAll',
	},
];

/** Optional category fields shared by Create (Additional Fields) and Update (Update Fields). */
const categoryFieldOptions: INodeProperties[] = [
	{
		displayName: 'Columns',
		name: 'column',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 1,
		description: 'Number of columns for subcategories in the top menu',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		description: 'HTML description in the selected language',
	},
	{
		displayName: 'Filter Names or IDs',
		name: 'filterIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getFilters' },
		default: [],
		description:
			'Filters shown in the category (replaces the current list). Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: '',
		placeholder: 'catalog/demo/canon_eos_5d_1.jpg',
		description: 'Image path relative to the image/ directory of the store',
	},
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
		description: 'Defaults to the name when a category is created',
	},
	{
		displayName: 'Parent Category Name or ID',
		name: 'parentId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getParentCategories' },
		default: '',
		description:
			'Use 0 for a top-level category. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		displayName: 'Show in Top Menu',
		name: 'top',
		type: 'boolean',
		default: false,
		description: 'Whether to show the category in the top menu (top-level categories only)',
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
		description: 'Whether the category is enabled',
	},
	{
		displayName: 'Store Names or IDs',
		name: 'storeIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getStores' },
		default: [],
		description:
			'Stores the category is shown in. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export const categoryFields: INodeProperties[] = [
	{
		displayName: 'Category Name or ID',
		name: 'categoryId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getCategories' },
		displayOptions: {
			show: {
				resource: ['category'],
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
				resource: ['category'],
				operation: ['create'],
			},
		},
		default: '',
		description:
			'Category name in the selected language. Other languages get a copy until translated.',
	},
	languageField('category', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['category'],
				operation: ['create'],
			},
		},
		default: {},
		options: categoryFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['category'],
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
				description: 'Category name in the selected language',
			},
			...categoryFieldOptions,
		],
	},
	...listFields('category'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['category'],
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
			{
				displayName: 'Parent Category Name or ID',
				name: 'parentId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getParentCategories' },
				default: '',
				description:
					'Only direct subcategories of this category; 0 = top level. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) categories',
			},
		],
	},
	sortOptions(
		'category',
		[
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Date Modified', value: 'date_modified' },
			{ name: 'ID', value: 'category_id' },
			{ name: 'Name (Path)', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'sort_order',
	),
];

const DESCRIPTION_FIELDS = {
	name: 'name',
	description: 'description',
	metaTitle: 'meta_title',
	metaDescription: 'meta_description',
	metaKeyword: 'meta_keyword',
};

export function buildCategoryRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { category_id: this.getNodeParameter('categoryId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
		}

		if (filters.parentId !== undefined && filters.parentId !== '') {
			params.filter_parent_id = filters.parentId;
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
					name: this.getNodeParameter('name', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);

	const params: IDataObject = {};

	if (operation === 'update') {
		params.category_id = this.getNodeParameter('categoryId', i);
	}

	const description = descriptionItem.call(this, i, fields, DESCRIPTION_FIELDS);

	if (description) {
		params.descriptions = [description];
	}

	if (fields.parentId !== undefined && fields.parentId !== '') {
		params.parent_id = fields.parentId;
	}

	const scalars: Record<string, string> = {
		image: 'image',
		top: 'top',
		column: 'column',
		sortOrder: 'sort_order',
		status: 'status',
		storeIds: 'stores',
		filterIds: 'filters',
	};

	for (const [nodeName, apiName] of Object.entries(scalars)) {
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
