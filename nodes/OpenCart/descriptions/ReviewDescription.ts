import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { languageField, listFields, listParams, sortOptions, toApiDate } from './common';

export const reviewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['review'],
			},
		},
		options: [
			{ name: 'Create', value: 'create', description: 'Create a product review', action: 'Create a review' },
			{ name: 'Delete', value: 'delete', description: 'Delete a review', action: 'Delete a review' },
			{ name: 'Get', value: 'get', description: 'Get a review', action: 'Get a review' },
			{ name: 'Get Many', value: 'getAll', description: 'Get many reviews', action: 'Get many reviews' },
			{
				name: 'Update',
				value: 'update',
				description: 'Update a review, e.g. publish it',
				action: 'Update a review',
			},
		],
		default: 'getAll',
	},
];

const RATING: INodeProperties = {
	displayName: 'Rating',
	name: 'rating',
	type: 'number',
	typeOptions: { minValue: 1, maxValue: 5 },
	default: 5,
};

const reviewFieldOptions: INodeProperties[] = [
	{
		displayName: 'Date Added',
		name: 'dateAdded',
		type: 'dateTime',
		default: '',
		description: 'Defaults to now on create',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'boolean',
		default: false,
		description: 'Whether the review is published',
	},
];

export const reviewFields: INodeProperties[] = [
	{
		displayName: 'Review ID',
		name: 'reviewId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['get', 'delete', 'update'],
			},
		},
		default: 0,
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['create'],
			},
		},
		default: 0,
	},
	{
		displayName: 'Author',
		name: 'author',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['create'],
			},
		},
		default: '',
		description: '3–64 characters',
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Plain text; HTML tags are removed',
	},
	{
		...RATING,
		required: true,
		displayOptions: {
			show: {
				resource: ['review'],
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
				resource: ['review'],
				operation: ['create'],
			},
		},
		default: {},
		options: reviewFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Author', name: 'author', type: 'string', default: '' },
			...reviewFieldOptions,
			{ displayName: 'Product ID', name: 'productId', type: 'number', default: 0 },
			RATING,
			{ displayName: 'Text', name: 'text', type: 'string', typeOptions: { rows: 4 }, default: '' },
		],
	},
	languageField('review', ['getAll']),
	...listFields('review'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['review'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Author Contains', name: 'author', type: 'string', default: '' },
			{ displayName: 'Date Added From', name: 'dateFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Added To', name: 'dateTo', type: 'dateTime', default: '' },
			{ displayName: 'Product ID', name: 'productId', type: 'number', default: 0 },
			{ displayName: 'Product Name Contains', name: 'product', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: false,
				description: 'Whether to return only published (true) or only unpublished (false) reviews',
			},
		],
	},
	sortOptions(
		'review',
		[
			{ name: 'Author', value: 'author' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'ID', value: 'review_id' },
			{ name: 'Product', value: 'product' },
			{ name: 'Rating', value: 'rating' },
			{ name: 'Status', value: 'status' },
		],
		'date_added',
	),
];

export function buildReviewRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { review_id: this.getNodeParameter('reviewId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const map: Record<string, string> = {
			author: 'filter_author',
			product: 'filter_product',
			productId: 'filter_product_id',
			status: 'filter_status',
		};

		for (const [nodeName, apiName] of Object.entries(map)) {
			if (filters[nodeName] !== undefined && filters[nodeName] !== '' && filters[nodeName] !== 0) {
				params[apiName] = filters[nodeName];
			}
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
					productId: this.getNodeParameter('productId', i),
					author: this.getNodeParameter('author', i),
					text: this.getNodeParameter('text', i),
					rating: this.getNodeParameter('rating', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);

	const params: IDataObject = {};

	if (operation === 'update') {
		params.review_id = this.getNodeParameter('reviewId', i);
	}

	const map: Record<string, string> = {
		productId: 'product_id',
		author: 'author',
		text: 'text',
		rating: 'rating',
		status: 'status',
	};

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined) {
			params[apiName] = fields[nodeName];
		}
	}

	if (fields.dateAdded) {
		params.date_added = toApiDate(fields.dateAdded);
	}

	return { action: operation, params };
}
