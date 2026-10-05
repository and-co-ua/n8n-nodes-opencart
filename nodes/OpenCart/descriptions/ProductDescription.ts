import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { ApiCall } from './common';
import {
	descriptionItem,
	languageField,
	listFields,
	listParams,
	seoUrlItem,
	sortOptions,
	toApiDate,
} from './common';

export const productOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['product'],
			},
		},
		options: [
			{
				name: 'Bulk Update',
				value: 'bulkUpdate',
				description:
					'Update price, stock, status and other simple fields of many products — one input item per product',
				action: 'Bulk update products',
			},
			{
				name: 'Copy',
				value: 'copy',
				description: 'Copy a product (the copy is disabled, without SKU and SEO URLs)',
				action: 'Copy a product',
			},
			{ name: 'Create', value: 'create', description: 'Create a product', action: 'Create a product' },
			{ name: 'Delete', value: 'delete', description: 'Delete a product', action: 'Delete a product' },
			{
				name: 'Get',
				value: 'get',
				description: 'Get a product with all its data and languages',
				action: 'Get a product',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many products', action: 'Get many products' },
			{ name: 'Update', value: 'update', description: 'Update a product', action: 'Update a product' },
		],
		default: 'getAll',
	},
];

/** Resource locator for a product: search by name / model / SKU, or ID. */
export const PRODUCT_LOCATOR: INodeProperties = {
	displayName: 'Product',
	name: 'productId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchProducts',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: '42',
			validation: [
				{
					type: 'regex',
					properties: { regex: '^[0-9]+$', errorMessage: 'The product ID must be a number' },
				},
			],
		},
	],
};

const SIMPLE_FIELDS: INodeProperties[] = [
	{
		displayName: 'Date Available',
		name: 'dateAvailable',
		type: 'dateTime',
		default: '',
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Minimum Quantity',
		name: 'minimum',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 1,
		description: 'Minimum order quantity',
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		typeOptions: { minValue: 0, numberPrecision: 4 },
		default: 0,
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		default: 0,
	},
	{
		displayName: 'Reward Points Price',
		name: 'points',
		type: 'number',
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Points needed to buy the product',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'number',
		default: 1,
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'boolean',
		default: true,
		description: 'Whether the product is enabled',
	},
	{
		displayName: 'Stock Status Name or ID',
		name: 'stockStatusId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getStockStatuses' },
		default: '',
		description:
			'Status shown when out of stock. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Subtract Stock',
		name: 'subtract',
		type: 'boolean',
		default: true,
		description: 'Whether orders subtract the quantity',
	},
	{
		displayName: 'Weight',
		name: 'weight',
		type: 'number',
		typeOptions: { minValue: 0, numberPrecision: 4 },
		default: 0,
	},
];

const PRICE_ROW: INodeProperties[] = [
	{
		displayName: 'Customer Group Name or ID',
		name: 'customerGroupId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCustomerGroups' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		typeOptions: { minValue: 0, numberPrecision: 4 },
		default: 0,
	},
	{ displayName: 'Priority', name: 'priority', type: 'number', default: 1 },
	{ displayName: 'Date Start', name: 'dateStart', type: 'dateTime', default: '' },
	{ displayName: 'Date End', name: 'dateEnd', type: 'dateTime', default: '' },
];

/** Optional product fields shared by Create (Additional Fields) and Update (Update Fields). */
const productFieldOptions: INodeProperties[] = [
	...SIMPLE_FIELDS,
	{
		displayName: 'Attributes',
		name: 'attributes',
		type: 'fixedCollection',
		placeholder: 'Add Attribute',
		typeOptions: { multipleValues: true },
		default: {},
		description:
			'Replaces the product attributes. Texts are set in the selected language; other languages keep their text (new attributes get a copy).',
		options: [
			{
				displayName: 'Attribute',
				name: 'attribute',
				values: [
					{
						displayName: 'Attribute Name or ID',
						name: 'attributeId',
						type: 'options',
						typeOptions: { loadOptionsMethod: 'getAttributes' },
						default: '',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
					},
					{ displayName: 'Text', name: 'text', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Category Names or IDs',
		name: 'categoryIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getCategories' },
		default: [],
		description:
			'Replaces the product categories. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		displayName: 'Dimensions',
		name: 'dimensions',
		type: 'fixedCollection',
		default: {},
		options: [
			{
				displayName: 'Dimensions',
				name: 'values',
				values: [
					{ displayName: 'Length', name: 'length', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
					{ displayName: 'Width', name: 'width', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
					{ displayName: 'Height', name: 'height', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
					{
						displayName: 'Length Class Name or ID',
						name: 'lengthClassId',
						type: 'options',
						typeOptions: { loadOptionsMethod: 'getLengthClasses' },
						default: '',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
					},
				],
			},
		],
	},
	{
		displayName: 'Discounts',
		name: 'discounts',
		type: 'fixedCollection',
		placeholder: 'Add Discount',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Quantity discounts; replaces the current ones',
		options: [
			{
				displayName: 'Discount',
				name: 'discount',
				values: [
					{ displayName: 'Quantity', name: 'quantity', type: 'number', typeOptions: { minValue: 1 }, default: 1 },
					...PRICE_ROW,
				],
			},
		],
	},
	{
		displayName: 'Download Names or IDs',
		name: 'downloadIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getDownloads' },
		default: [],
		description:
			'Replaces the product downloads. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'EAN',
		name: 'ean',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Filter Names or IDs',
		name: 'filterIds',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getFilters' },
		default: [],
		description:
			'Replaces the product filters. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Image',
		name: 'image',
		type: 'string',
		default: '',
		placeholder: 'catalog/products/tshirt.jpg',
		description: 'Main image: path of an existing file relative to the image/ directory',
	},
	{
		displayName: 'Images',
		name: 'images',
		type: 'fixedCollection',
		placeholder: 'Add Image',
		typeOptions: { multipleValues: true, sortable: true },
		default: {},
		description: 'Additional images (paths relative to image/); replaces the current ones',
		options: [
			{
				displayName: 'Image',
				name: 'image',
				values: [
					{ displayName: 'Path', name: 'image', type: 'string', default: '' },
					{ displayName: 'Sort Order', name: 'sortOrder', type: 'number', default: 0 },
				],
			},
		],
	},
	{
		displayName: 'ISBN',
		name: 'isbn',
		type: 'string',
		default: '',
	},
	{
		displayName: 'JAN',
		name: 'jan',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Manufacturer Name or ID',
		name: 'manufacturerId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getManufacturers' },
		default: '',
		description:
			'Use 0 for none. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		description: 'Defaults to the name when a product is created',
	},
	{
		displayName: 'MPN',
		name: 'mpn',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Options (JSON)',
		name: 'optionsJson',
		type: 'json',
		default: '[]',
		description:
			'Product options as in the API: [{"option_id": 5, "required": true, "values": [{"option_value_id": 39, "quantity": 10, "price": 2, "price_prefix": "+"}]}]. Replaces the current options; IDs of options and values that stay are kept.',
	},
	{
		displayName: 'Related Product IDs',
		name: 'relatedIds',
		type: 'string',
		default: '',
		placeholder: '40, 42',
		description: 'Comma-separated product IDs; replaces the current related products',
	},
	{
		displayName: 'Requires Shipping',
		name: 'shipping',
		type: 'boolean',
		default: true,
		description: 'Whether the product requires shipping',
	},
	{
		displayName: 'Rewards',
		name: 'rewards',
		type: 'fixedCollection',
		placeholder: 'Add Reward',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Reward points earned per customer group; replaces the current ones',
		options: [
			{
				displayName: 'Reward',
				name: 'reward',
				values: [
					PRICE_ROW[0],
					{ displayName: 'Points', name: 'points', type: 'number', typeOptions: { minValue: 0 }, default: 0 },
				],
			},
		],
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
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Specials',
		name: 'specials',
		type: 'fixedCollection',
		placeholder: 'Add Special',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Special prices; replaces the current ones',
		options: [
			{
				displayName: 'Special',
				name: 'special',
				values: PRICE_ROW,
			},
		],
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
	{
		displayName: 'Tags',
		name: 'tag',
		type: 'string',
		default: '',
		description: 'Comma-separated tags in the selected language',
	},
	{
		displayName: 'Tax Class Name or ID',
		name: 'taxClassId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTaxClasses' },
		default: '',
		description:
			'Use 0 for none. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'UPC',
		name: 'upc',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Weight Class Name or ID',
		name: 'weightClassId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getWeightClasses' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
];

export const productFields: INodeProperties[] = [
	{
		...PRODUCT_LOCATOR,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['get', 'delete', 'update', 'copy'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Product name in the selected language. Other languages get a copy until translated.',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Product code (1–64 characters)',
	},
	languageField('product', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
		default: {},
		options: productFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Model', name: 'model', type: 'string', default: '' },
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Product name in the selected language',
			},
			...productFieldOptions,
		],
	},

	// Bulk Update
	{
		displayName: 'Match By',
		name: 'matchBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['bulkUpdate'],
			},
		},
		options: [
			{ name: 'Model', value: 'model' },
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'SKU', value: 'sku' },
		],
		default: 'sku',
		description: 'How each input item identifies its product (exact match)',
	},
	{
		displayName: 'Match Value',
		name: 'matchValue',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['bulkUpdate'],
			},
		},
		default: '',
		placeholder: '={{ $json.sku }}',
		description: 'Product ID, model or SKU of the product for this item',
	},
	{
		displayName: 'Fields to Update',
		name: 'bulkFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['bulkUpdate'],
			},
		},
		default: {},
		options: SIMPLE_FIELDS,
	},

	// Get Many
	...listFields('product'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Category Name or ID',
				name: 'categoryId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getCategories' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'Include Subcategories',
				name: 'subCategory',
				type: 'boolean',
				default: true,
				description: 'Whether the category filter also matches products of its subcategories',
			},
			{
				displayName: 'Manufacturer Name or ID',
				name: 'manufacturerId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getManufacturers' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{ displayName: 'Model (Exact)', name: 'model', type: 'string', default: '' },
			{ displayName: 'Modified From', name: 'dateModifiedFrom', type: 'dateTime', default: '' },
			{ displayName: 'Modified To', name: 'dateModifiedTo', type: 'dateTime', default: '' },
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{ displayName: 'Price Max', name: 'priceMax', type: 'number', default: 0 },
			{ displayName: 'Price Min', name: 'priceMin', type: 'number', default: 0 },
			{ displayName: 'Quantity Max', name: 'quantityMax', type: 'number', default: 0 },
			{ displayName: 'Quantity Min', name: 'quantityMin', type: 'number', default: 0 },
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Name, model or SKU contains',
			},
			{ displayName: 'SKU (Exact)', name: 'sku', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) products',
			},
		],
	},
	sortOptions(
		'product',
		[
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Date Modified', value: 'date_modified' },
			{ name: 'ID', value: 'product_id' },
			{ name: 'Model', value: 'model' },
			{ name: 'Name', value: 'name' },
			{ name: 'Price', value: 'price' },
			{ name: 'Quantity', value: 'quantity' },
			{ name: 'SKU', value: 'sku' },
			{ name: 'Sort Order', value: 'sort_order' },
			{ name: 'Status', value: 'status' },
		],
		'name',
	),
];

const DESCRIPTION_FIELDS = {
	name: 'name',
	description: 'description',
	tag: 'tag',
	metaTitle: 'meta_title',
	metaDescription: 'meta_description',
	metaKeyword: 'meta_keyword',
};

/** Node field → API field for scalars that are passed as they are. */
const SCALARS: Record<string, string> = {
	model: 'model',
	sku: 'sku',
	upc: 'upc',
	ean: 'ean',
	jan: 'jan',
	isbn: 'isbn',
	mpn: 'mpn',
	location: 'location',
	price: 'price',
	quantity: 'quantity',
	minimum: 'minimum',
	subtract: 'subtract',
	points: 'points',
	shipping: 'shipping',
	weight: 'weight',
	status: 'status',
	sortOrder: 'sort_order',
	image: 'image',
	stockStatusId: 'stock_status_id',
	manufacturerId: 'manufacturer_id',
	taxClassId: 'tax_class_id',
	weightClassId: 'weight_class_id',
	storeIds: 'stores',
	categoryIds: 'categories',
	filterIds: 'filters',
	downloadIds: 'downloads',
};

function priceRows(rows: IDataObject[] | undefined, withQuantity: boolean): IDataObject[] | undefined {
	if (rows === undefined) {
		return undefined;
	}

	return rows.map((row) => {
		const item: IDataObject = {
			customer_group_id: row.customerGroupId,
			price: row.price,
			priority: row.priority,
			date_start: toApiDate(row.dateStart) ?? null,
			date_end: toApiDate(row.dateEnd) ?? null,
		};

		if (withQuantity) {
			item.quantity = row.quantity;
		}

		return item;
	});
}

/** Fields of Create / Update → API params. */
function productParams(this: IExecuteFunctions, i: number, fields: IDataObject): IDataObject {
	const params: IDataObject = {};

	for (const [nodeName, apiName] of Object.entries(SCALARS)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			params[apiName] = fields[nodeName];
		}
	}

	if (fields.dateAvailable) {
		params.date_available = toApiDate(fields.dateAvailable);
	}

	const description = descriptionItem.call(this, i, fields, DESCRIPTION_FIELDS);

	if (description) {
		params.descriptions = [description];
	}

	const seoUrls = seoUrlItem.call(this, i, fields.seoKeyword);

	if (seoUrls) {
		params.seo_urls = seoUrls;
	}

	const dimensions = (fields.dimensions as IDataObject | undefined)?.values as IDataObject | undefined;

	if (dimensions) {
		params.length = dimensions.length;
		params.width = dimensions.width;
		params.height = dimensions.height;

		if (dimensions.lengthClassId !== '') {
			params.length_class_id = dimensions.lengthClassId;
		}
	}

	if (fields.relatedIds !== undefined) {
		params.related = String(fields.relatedIds)
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id !== '');
	}

	if (fields.images !== undefined) {
		params.images = (((fields.images as IDataObject).image as IDataObject[]) ?? []).map((row) => ({
			image: row.image,
			sort_order: row.sortOrder,
		}));
	}

	if (fields.attributes !== undefined) {
		params.attributes = (((fields.attributes as IDataObject).attribute as IDataObject[]) ?? []).map(
			(row) => ({
				attribute_id: row.attributeId,
				descriptions: [descriptionItem.call(this, i, { text: row.text }, { text: 'text' })],
			}),
		);
	}

	const discounts = priceRows((fields.discounts as IDataObject | undefined)?.discount as IDataObject[], true);
	const specials = priceRows((fields.specials as IDataObject | undefined)?.special as IDataObject[], false);

	if (fields.discounts !== undefined) {
		params.discounts = discounts ?? [];
	}

	if (fields.specials !== undefined) {
		params.specials = specials ?? [];
	}

	if (fields.rewards !== undefined) {
		params.rewards = (((fields.rewards as IDataObject).reward as IDataObject[]) ?? []).map((row) => ({
			customer_group_id: row.customerGroupId,
			points: row.points,
		}));
	}

	if (fields.optionsJson !== undefined) {
		let options: unknown = fields.optionsJson;

		if (typeof options === 'string') {
			try {
				options = JSON.parse(options);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Options (JSON) is not valid JSON', { itemIndex: i });
			}
		}

		if (!Array.isArray(options)) {
			throw new NodeOperationError(this.getNode(), 'Options (JSON) must be an array', { itemIndex: i });
		}

		params.options = options as IDataObject[];
	}

	return params;
}

/** Simple fields of one Bulk Update item. */
export function bulkItem(this: IExecuteFunctions, i: number): IDataObject {
	const fields = this.getNodeParameter('bulkFields', i, {}) as IDataObject;
	const item: IDataObject = {
		[this.getNodeParameter('matchBy', i) as string]: this.getNodeParameter('matchValue', i),
	};

	for (const [nodeName, apiName] of Object.entries(SCALARS)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			item[apiName] = fields[nodeName];
		}
	}

	if (fields.dateAvailable) {
		item.date_available = toApiDate(fields.dateAvailable);
	}

	return item;
}

export function buildProductRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const productId = () => this.getNodeParameter('productId', i, undefined, { extractValue: true });

	if (operation === 'get' || operation === 'delete' || operation === 'copy') {
		return { action: operation, params: { product_id: productId() } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
		const map: Record<string, string> = {
			name: 'filter_name',
			search: 'filter_search',
			model: 'filter_model',
			sku: 'filter_sku',
			status: 'filter_status',
			manufacturerId: 'filter_manufacturer_id',
			quantityMin: 'filter_quantity_min',
			quantityMax: 'filter_quantity_max',
			priceMin: 'filter_price_min',
			priceMax: 'filter_price_max',
		};

		for (const [nodeName, apiName] of Object.entries(map)) {
			if (filters[nodeName] !== undefined && filters[nodeName] !== '') {
				params[apiName] = filters[nodeName];
			}
		}

		if (filters.categoryId !== undefined && filters.categoryId !== '') {
			params.filter_category_id = filters.categoryId;
			params.filter_sub_category = filters.subCategory ?? true;
		}

		if (filters.dateModifiedFrom) {
			params.filter_date_modified_from = toApiDate(filters.dateModifiedFrom);
		}

		if (filters.dateModifiedTo) {
			params.filter_date_modified_to = toApiDate(filters.dateModifiedTo, true);
		}

		return { action: 'list', params, list: true };
	}

	if (operation === 'create') {
		const fields = {
			...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
			name: this.getNodeParameter('name', i),
			model: this.getNodeParameter('model', i),
		};

		return { action: 'create', params: productParams.call(this, i, fields) };
	}

	const params = productParams.call(this, i, this.getNodeParameter('updateFields', i, {}) as IDataObject);

	params.product_id = productId();

	return { action: 'update', params };
}
