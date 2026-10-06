import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { listFields, listParams, sortOptions, toApiDate } from './common';

export const couponOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['coupon'],
			},
		},
		options: [
			{ name: 'Create', value: 'create', description: 'Create a coupon', action: 'Create a coupon' },
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a coupon with its usage history',
				action: 'Delete a coupon',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a coupon with its products and categories',
				action: 'Get a coupon',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get the orders the coupon was used in',
				action: 'Get the history of a coupon',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many coupons', action: 'Get many coupons' },
			{ name: 'Update', value: 'update', description: 'Update a coupon', action: 'Update a coupon' },
		],
		default: 'getAll',
	},
];

const TYPE: INodeProperties = {
	displayName: 'Type',
	name: 'type',
	type: 'options',
	options: [
		{ name: 'Percentage', value: 'P' },
		{ name: 'Fixed Amount', value: 'F' },
	],
	default: 'P',
};

const couponFieldOptions: INodeProperties[] = [
	{
		displayName: 'Category Names or IDs',
		name: 'categoryIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getCategories' },
		default: [],
		description:
			'Limit the coupon to products of these categories and their subcategories (replaces the current list). Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Code',
		name: 'code',
		type: 'string',
		default: '',
		description: '3–20 characters, unique. Generated on create when empty.',
	},
	{ displayName: 'Customer Login Required', name: 'logged', type: 'boolean', default: false, description: 'Whether only logged-in customers can use the coupon' },
	{ displayName: 'Date End', name: 'dateEnd', type: 'dateTime', default: '', description: 'Defaults to one month from now on create' },
	{ displayName: 'Date Start', name: 'dateStart', type: 'dateTime', default: '', description: 'Defaults to today on create' },
	{ displayName: 'Discount', name: 'discount', type: 'number', typeOptions: { minValue: 0, numberPrecision: 4 }, default: 0 },
	{ displayName: 'Free Shipping', name: 'shipping', type: 'boolean', default: false },
	{ displayName: 'Minimum Total', name: 'total', type: 'number', typeOptions: { minValue: 0 }, default: 0, description: 'Order total the cart must reach' },
	{
		displayName: 'No Date Limit',
		name: 'noDateLimit',
		type: 'boolean',
		default: false,
		description: 'Whether to remove the start and end dates (overrides Date Start / Date End)',
	},
	{
		displayName: 'Product IDs',
		name: 'productIds',
		type: 'string',
		default: '',
		placeholder: '40, 42',
		description: 'Limit the coupon to these products, comma-separated (replaces the current list)',
	},
	{ displayName: 'Status', name: 'status', type: 'boolean', default: true, description: 'Whether the coupon is enabled' },
	TYPE,
	{ displayName: 'Uses per Coupon', name: 'usesTotal', type: 'number', typeOptions: { minValue: 0 }, default: 1 },
	{ displayName: 'Uses per Customer', name: 'usesCustomer', type: 'number', typeOptions: { minValue: 0 }, default: 1 },
];

export const couponFields: INodeProperties[] = [
	{
		displayName: 'Coupon ID',
		name: 'couponId',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['get', 'delete', 'update', 'getHistory'],
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
				resource: ['coupon'],
				operation: ['create'],
			},
		},
		default: '',
		description: '3–128 characters',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
		default: {},
		options: couponFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['update'],
			},
		},
		default: {},
		options: [...couponFieldOptions, { displayName: 'Name', name: 'name', type: 'string', default: '' }],
	},
	...listFields('coupon', ['getAll', 'getHistory']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Active Now',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether to return only coupons that are enabled and within their dates',
			},
			{ displayName: 'Code', name: 'code', type: 'string', default: '' },
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) coupons',
			},
		],
	},
	sortOptions(
		'coupon',
		[
			{ name: 'Code', value: 'code' },
			{ name: 'Date End', value: 'date_end' },
			{ name: 'Date Start', value: 'date_start' },
			{ name: 'Discount', value: 'discount' },
			{ name: 'ID', value: 'coupon_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Status', value: 'status' },
		],
		'name',
	),
];

export function buildCouponRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const couponId = () => this.getNodeParameter('couponId', i);

	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { coupon_id: couponId() } };
	}

	if (operation === 'getHistory') {
		return { action: 'history', params: { coupon_id: couponId() }, list: true };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const map: Record<string, string> = {
			name: 'filter_name',
			code: 'filter_code',
			status: 'filter_status',
			active: 'filter_active',
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
					name: this.getNodeParameter('name', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);
	const params: IDataObject = {};

	if (operation === 'update') {
		params.coupon_id = couponId();
	}

	const map: Record<string, string> = {
		name: 'name',
		code: 'code',
		type: 'type',
		discount: 'discount',
		total: 'total',
		logged: 'logged',
		shipping: 'shipping',
		usesTotal: 'uses_total',
		usesCustomer: 'uses_customer',
		status: 'status',
		categoryIds: 'categories',
	};

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			params[apiName] = fields[nodeName];
		}
	}

	if (fields.productIds !== undefined) {
		params.products = String(fields.productIds)
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id !== '');
	}

	if (fields.noDateLimit) {
		params.date_start = null;
		params.date_end = null;
	} else {
		if (fields.dateStart) {
			params.date_start = toApiDate(fields.dateStart);
		}

		if (fields.dateEnd) {
			params.date_end = toApiDate(fields.dateEnd);
		}
	}

	return { action: operation, params };
}
