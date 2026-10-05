import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { ApiCall } from './common';
import { languageField, listFields, listParams, sortOptions, toApiDate } from './common';
import { CUSTOMER_LOCATOR } from './CustomerDescription';

const ORDER_ID: INodeProperties = {
	displayName: 'Order ID',
	name: 'orderId',
	type: 'number',
	required: true,
	default: 0,
};

const CHECKOUT_OPERATIONS = ['create', 'update', 'quote'];

export const orderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['order'],
			},
		},
		options: [
			{
				name: 'Add Commission',
				value: 'addCommission',
				description: "Pay the affiliate's commission for the order",
				action: 'Add the commission of an order',
			},
			{
				name: 'Add History',
				value: 'addHistory',
				description: 'Change the order status (stock, e-mails and the rest as in the admin panel)',
				action: 'Change the status of an order',
			},
			{
				name: 'Add Reward Points',
				value: 'addReward',
				description: 'Give the customer the reward points of the order',
				action: 'Add the reward points of an order',
			},
			{
				name: 'Create',
				value: 'create',
				description: "Create an order through the store's checkout",
				action: 'Create an order',
			},
			{
				name: 'Create Invoice Number',
				value: 'createInvoiceNo',
				description: 'Generate the invoice number of an order',
				action: 'Create the invoice number of an order',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an order (stock and balances are reverted)',
				action: 'Delete an order',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an order with products, totals and history',
				action: 'Get an order',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get the status history of an order',
				action: 'Get the history of an order',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many orders', action: 'Get many orders' },
			{
				name: 'Quote',
				value: 'quote',
				description:
					'Calculate an order without saving it: available shipping and payment methods and totals',
				action: 'Quote an order',
			},
			{
				name: 'Remove Commission',
				value: 'removeCommission',
				description: "Remove the affiliate's commission of the order",
				action: 'Remove the commission of an order',
			},
			{
				name: 'Remove Reward Points',
				value: 'removeReward',
				description: 'Remove the reward points the order gave',
				action: 'Remove the reward points of an order',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Edit an order like the admin panel does',
				action: 'Update an order',
			},
		],
		default: 'getAll',
	},
];

const ADDRESS_FIELDS: INodeProperties[] = [
	{ displayName: 'First Name', name: 'firstname', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'lastname', type: 'string', default: '' },
	{ displayName: 'Company', name: 'company', type: 'string', default: '' },
	{ displayName: 'Address 1', name: 'address1', type: 'string', default: '' },
	{ displayName: 'Address 2', name: 'address2', type: 'string', default: '' },
	{ displayName: 'City', name: 'city', type: 'string', default: '' },
	{ displayName: 'Postcode', name: 'postcode', type: 'string', default: '' },
	{
		displayName: 'Country Name or ID',
		name: 'countryId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCountries' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Zone ID',
		name: 'zoneId',
		type: 'number',
		default: 0,
		description: 'Region of the country (see Lookup → Zones); 0 = none',
	},
];

function address(displayName: string, name: string, description: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		placeholder: `Add ${displayName}`,
		default: {},
		description,
		options: [{ displayName, name: 'address', values: ADDRESS_FIELDS }],
	};
}

/** Checkout fields shared by Create, Update and Quote (Order Fields). */
const checkoutFieldOptions: INodeProperties[] = [
	{
		displayName: 'Affiliate ID',
		name: 'affiliateId',
		type: 'number',
		default: 0,
		description: 'Affiliate customer for the commission, 0 for none',
	},
	{ displayName: 'Comment', name: 'comment', type: 'string', typeOptions: { rows: 3 }, default: '' },
	{ displayName: 'Coupon Code', name: 'coupon', type: 'string', default: '' },
	{
		displayName: 'Currency Name or ID',
		name: 'currencyCode',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getCurrencyCodes' },
		default: '',
		description: 'Choose from the list, or specify a code using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Custom Fields (JSON)',
		name: 'customFieldsJson',
		type: 'json',
		default: '{}',
		description: 'Account custom fields as {"custom_field_id": value}',
	},
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
		displayName: 'Gift Vouchers to Buy',
		name: 'vouchers',
		type: 'fixedCollection',
		placeholder: 'Add Gift Voucher',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Gift vouchers in the order. On update the list replaces the current vouchers.',
		options: [
			{
				displayName: 'Gift Voucher',
				name: 'voucher',
				values: [
					{
						displayName: 'Amount',
						name: 'amount',
						type: 'number',
						default: 0
					},
					{
						displayName: 'From Email',
						name: 'fromEmail',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
					},
					{
						displayName: 'From Name',
						name: 'fromName',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Message',
						name: 'message',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Theme Name or ID',
						name: 'voucherThemeId',
						type: 'options',
						default: '',
						description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
					},
					{
						displayName: 'To Email',
						name: 'toEmail',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
					},
					{
						displayName: 'To Name',
						name: 'toName',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Order Status Name or ID',
		name: 'orderStatusId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getOrderStatuses' },
		default: '',
		description:
			'Defaults to the store setting on create, current status on update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	address('Payment Address', 'paymentAddress', "Defaults to the customer's default address"),
	{
		displayName: 'Payment Method Code',
		name: 'paymentMethod',
		type: 'string',
		default: '',
		placeholder: 'cod',
		description: 'Code from the Quote operation',
	},
	{
		displayName: 'Products',
		name: 'products',
		type: 'fixedCollection',
		placeholder: 'Add Product',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'On update the list replaces the current products',
		options: [
			{
				displayName: 'Product',
				name: 'product',
				values: [
					{ displayName: 'Product ID', name: 'productId', type: 'number', default: 0 },
					{ displayName: 'Quantity', name: 'quantity', type: 'number', typeOptions: { minValue: 1 }, default: 1 },
					{
						displayName: 'Options (JSON)',
						name: 'optionsJson',
						type: 'json',
						default: '{}',
						description:
							'{"product_option_id": product_option_value_id} for select/radio, an array for checkbox, text for text options',
					},
				],
			},
		],
	},
	{
		displayName: 'Reward Points to Use',
		name: 'reward',
		type: 'number',
		default: 0,
	},
	address('Shipping Address', 'shippingAddress', 'Defaults to the payment address'),
	{
		displayName: 'Shipping Method Code',
		name: 'shippingMethod',
		type: 'string',
		default: '',
		placeholder: 'flat.flat',
		description: 'Code from the Quote operation',
	},
	{
		displayName: 'Store Name or ID',
		name: 'storeId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getStores' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{ displayName: 'Gift Voucher Code to Use', name: 'voucher', type: 'string', default: '' },
];

export const orderFields: INodeProperties[] = [
	{
		...ORDER_ID,
		displayOptions: {
			show: {
				resource: ['order'],
				operation: [
					'get',
					'delete',
					'update',
					'getHistory',
					'addHistory',
					'createInvoiceNo',
					'addReward',
					'removeReward',
					'addCommission',
					'removeCommission',
				],
			},
		},
	},

	// Customer of a new order
	{
		displayName: 'Customer Type',
		name: 'customerType',
		type: 'options',
		options: [
			{ name: 'Guest', value: 'guest' },
			{ name: 'Registered Customer', value: 'registered' },
		],
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create', 'quote'],
			},
		},
		default: 'guest',
	},
	{
		...CUSTOMER_LOCATOR,
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create', 'quote'],
				customerType: ['registered'],
			},
		},
	},
	...['firstname', 'lastname', 'email', 'telephone'].map(
		(name): INodeProperties => ({
			displayName: { firstname: 'First Name', lastname: 'Last Name', email: 'Email', telephone: 'Telephone' }[
				name
			] as string,
			name,
			type: 'string',
			required: true,
			placeholder: name === 'email' ? 'name@email.com' : undefined,
			displayOptions: {
				show: {
					resource: ['order'],
					operation: ['create', 'quote'],
					customerType: ['guest'],
				},
			},
			default: '',
		}),
	),
	languageField('order', ['create', 'update', 'quote', 'get', 'getAll', 'getHistory']),
	{
		displayName: 'Order Fields',
		name: 'orderFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: CHECKOUT_OPERATIONS,
			},
		},
		default: {},
		options: [
			...checkoutFieldOptions,
			{
				displayName: 'Customer (Update)',
				name: 'customerFields',
				type: 'fixedCollection',
				default: {},
				description: 'Change the customer data of the order (update only)',
				options: [
					{
						displayName: 'Customer',
						name: 'customer',
						values: [
							{
						displayName: 'Customer ID',
						name: 'customerId',
						type: 'number',
						default: 0
							},
							{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
							},
							{
						displayName: 'First Name',
						name: 'firstname',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Last Name',
						name: 'lastname',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Telephone',
						name: 'telephone',
						type: 'string',
						default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Notify Customer',
				name: 'notify',
				type: 'boolean',
				default: false,
				description:
					'Whether the store may send its order e-mails again (update only; the store re-sends confirmations on every edit)',
			},
		],
	},

	// Add History
	{
		displayName: 'Order Status Name or ID',
		name: 'orderStatusId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getOrderStatuses' },
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['addHistory'],
			},
		},
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Options',
		name: 'historyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['order'],
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
			{
				displayName: 'Override Fraud Check',
				name: 'override',
				type: 'boolean',
				default: false,
				description: 'Whether to skip the anti-fraud check',
			},
		],
	},
	{
		displayName: 'Notify',
		name: 'notify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['addReward', 'addCommission'],
			},
		},
		default: true,
		description: 'Whether to e-mail the customer / affiliate, as the admin panel does',
	},

	// Get Many / Get History
	...listFields('order', ['getAll', 'getHistory']),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Customer ID', name: 'customerId', type: 'number', default: 0, description: '0 = guest orders' },
			{ displayName: 'Customer Name Contains', name: 'customer', type: 'string', default: '' },
			{ displayName: 'Date Added From', name: 'dateAddedFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Added To', name: 'dateAddedTo', type: 'dateTime', default: '' },
			{ displayName: 'Date Modified From', name: 'dateModifiedFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Modified To', name: 'dateModifiedTo', type: 'dateTime', default: '' },
			{
				displayName: 'Email (Exact)',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{
				displayName: 'Order Status Names or IDs',
				name: 'orderStatusIds',
				type: 'multiOptions',
				typeOptions: { loadOptionsMethod: 'getOrderStatuses' },
				default: [],
				description:
					'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{ name: 'Processing', value: 'processing' },
					{ name: 'Complete', value: 'complete' },
				],
				default: 'processing',
				description: 'Statuses of the store settings Processing / Complete Order Status',
			},
			{ displayName: 'Store ID', name: 'storeId', type: 'number', default: 0 },
			{ displayName: 'Total Max', name: 'totalMax', type: 'number', default: 0 },
			{ displayName: 'Total Min', name: 'totalMin', type: 'number', default: 0 },
		],
	},
	sortOptions(
		'order',
		[
			{ name: 'Customer', value: 'customer' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Date Modified', value: 'date_modified' },
			{ name: 'ID', value: 'order_id' },
			{ name: 'Status', value: 'order_status' },
			{ name: 'Total', value: 'total' },
		],
		'order_id',
	),
];

function parseJson(this: IExecuteFunctions, i: number, value: unknown, label: string): IDataObject {
	if (typeof value !== 'string') {
		return (value ?? {}) as IDataObject;
	}

	try {
		return JSON.parse(value || '{}') as IDataObject;
	} catch {
		throw new NodeOperationError(this.getNode(), `${label} is not valid JSON`, { itemIndex: i });
	}
}

function addressParam(value: unknown): IDataObject | undefined {
	const row = (value as IDataObject | undefined)?.address as IDataObject | undefined;

	if (!row) {
		return undefined;
	}

	const item: IDataObject = {};
	const map: Record<string, string> = {
		firstname: 'firstname',
		lastname: 'lastname',
		company: 'company',
		address1: 'address_1',
		address2: 'address_2',
		city: 'city',
		postcode: 'postcode',
	};

	// Only filled fields: on update the rest of the address stays
	for (const [nodeName, apiName] of Object.entries(map)) {
		if (row[nodeName] !== undefined && row[nodeName] !== '') {
			item[apiName] = row[nodeName];
		}
	}

	if (row.countryId !== undefined && row.countryId !== '') {
		item.country_id = row.countryId;
	}

	if (row.zoneId) {
		item.zone_id = row.zoneId;
	}

	return item;
}

function checkoutParams(this: IExecuteFunctions, operation: string, i: number): IDataObject {
	const fields = this.getNodeParameter('orderFields', i, {}) as IDataObject;
	const params: IDataObject = {};
	const languageId = this.getNodeParameter('languageId', i, '') as string | number;

	if (languageId !== '') {
		params.language_id = languageId;
	}

	if (operation !== 'update') {
		if (this.getNodeParameter('customerType', i) === 'registered') {
			params.customer_id = this.getNodeParameter('customerId', i, undefined, { extractValue: true });
		} else {
			for (const name of ['firstname', 'lastname', 'email', 'telephone']) {
				params[name] = this.getNodeParameter(name, i);
			}
		}
	}

	const customer = (fields.customerFields as IDataObject | undefined)?.customer as IDataObject | undefined;

	if (customer) {
		if (customer.customerId) {
			params.customer_id = customer.customerId;
		}

		for (const name of ['firstname', 'lastname', 'email', 'telephone']) {
			if (customer[name]) {
				params[name] = customer[name];
			}
		}
	}

	const map: Record<string, string> = {
		storeId: 'store_id',
		currencyCode: 'currency_code',
		customerGroupId: 'customer_group_id',
		shippingMethod: 'shipping_method',
		paymentMethod: 'payment_method',
		coupon: 'coupon',
		voucher: 'voucher',
		reward: 'reward',
		comment: 'comment',
		orderStatusId: 'order_status_id',
		affiliateId: 'affiliate_id',
		notify: 'notify',
	};

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			params[apiName] = fields[nodeName];
		}
	}

	if (fields.customFieldsJson !== undefined) {
		params.custom_fields = parseJson.call(this, i, fields.customFieldsJson, 'Custom Fields (JSON)');
	}

	const paymentAddress = addressParam(fields.paymentAddress);
	const shippingAddress = addressParam(fields.shippingAddress);

	if (paymentAddress) {
		params.payment_address = paymentAddress;
	}

	if (shippingAddress) {
		params.shipping_address = shippingAddress;
	}

	if (fields.products !== undefined) {
		params.products = (((fields.products as IDataObject).product as IDataObject[]) ?? []).map((row) => ({
			product_id: row.productId,
			quantity: row.quantity,
			options: parseJson.call(this, i, row.optionsJson, 'Options (JSON)'),
		}));
	}

	if (fields.vouchers !== undefined) {
		params.vouchers = (((fields.vouchers as IDataObject).voucher as IDataObject[]) ?? []).map((row) => ({
			from_name: row.fromName,
			from_email: row.fromEmail,
			to_name: row.toName,
			to_email: row.toEmail,
			voucher_theme_id: row.voucherThemeId,
			message: row.message,
			amount: row.amount,
		}));
	}

	return params;
}

export function buildOrderRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const orderId = () => this.getNodeParameter('orderId', i);
	const simple: Record<string, string> = {
		get: 'get',
		delete: 'delete',
		createInvoiceNo: 'create_invoice_no',
		removeReward: 'remove_reward',
		removeCommission: 'remove_commission',
	};

	if (simple[operation]) {
		const params: IDataObject = { order_id: orderId() };
		const languageId = this.getNodeParameter('languageId', i, '') as string | number;

		if (operation === 'get' && languageId !== '') {
			params.language_id = languageId;
		}

		return { action: simple[operation], params };
	}

	switch (operation) {
		case 'addReward':
		case 'addCommission':
			return {
				action: operation === 'addReward' ? 'add_reward' : 'add_commission',
				params: { order_id: orderId(), notify: this.getNodeParameter('notify', i, true) },
			};

		case 'addHistory': {
			const options = this.getNodeParameter('historyOptions', i, {}) as IDataObject;

			return {
				action: 'add_history',
				params: {
					order_id: orderId(),
					order_status_id: this.getNodeParameter('orderStatusId', i),
					comment: options.comment ?? '',
					notify: options.notify ?? false,
					override: options.override ?? false,
				},
			};
		}

		case 'getHistory': {
			const params = listParams.call(this, i);

			params.order_id = orderId();

			return { action: 'history', params, list: true };
		}

		case 'getAll': {
			const params = listParams.call(this, i);
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const map: Record<string, string> = {
				customerId: 'filter_customer_id',
				customer: 'filter_customer',
				email: 'filter_email',
				state: 'filter_state',
				storeId: 'filter_store_id',
				totalMin: 'filter_total_min',
				totalMax: 'filter_total_max',
			};

			for (const [nodeName, apiName] of Object.entries(map)) {
				if (filters[nodeName] !== undefined && filters[nodeName] !== '') {
					params[apiName] = filters[nodeName];
				}
			}

			if (Array.isArray(filters.orderStatusIds) && filters.orderStatusIds.length) {
				params.filter_order_status_ids = filters.orderStatusIds;
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
			// create, update, quote
			const params = checkoutParams.call(this, operation, i);

			if (operation === 'update') {
				params.order_id = orderId();
			}

			return { action: operation, params };
		}
	}
}
