import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { StandardSession } from '../StandardFunctions';
import { standardLogin, standardRequest } from '../StandardFunctions';

/**
 * API = Standard OpenCart API: orders through catalog/controller/api/* built into OpenCart 3,
 * in the order the admin order form calls it.
 */

const STANDARD = { api: ['standard'] };

export const standardResourceFields: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'standardResource',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: STANDARD },
		options: [{ name: 'Order', value: 'order' }],
		default: 'order',
	},
	{
		displayName: 'Operation',
		name: 'standardOperation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { ...STANDARD, standardResource: ['order'] } },
		options: [
			{
				name: 'Change Status',
				value: 'changeStatus',
				description: 'Add a status to the order history',
				action: 'Change the status of an order',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create an order through the store checkout',
				action: 'Create an order',
			},
			{ name: 'Delete', value: 'delete', description: 'Delete an order', action: 'Delete an order' },
			{ name: 'Get', value: 'get', description: 'Get the order details', action: 'Get an order' },
			{
				name: 'Quote',
				value: 'quote',
				description: 'Get shipping and payment methods and totals without saving an order',
				action: 'Quote an order',
			},
		],
		default: 'create',
	},
];

function show(operations: string[]) {
	return { show: { ...STANDARD, standardResource: ['order'], standardOperation: operations } };
}

const ADDRESS_FIELDS: INodeProperties[] = [
	{ displayName: 'First Name', name: 'firstname', type: 'string', default: '' },
	{ displayName: 'Last Name', name: 'lastname', type: 'string', default: '' },
	{ displayName: 'Company', name: 'company', type: 'string', default: '' },
	{ displayName: 'Address 1', name: 'address1', type: 'string', default: '' },
	{ displayName: 'Address 2', name: 'address2', type: 'string', default: '' },
	{ displayName: 'City', name: 'city', type: 'string', default: '' },
	{ displayName: 'Postcode', name: 'postcode', type: 'string', default: '' },
	{ displayName: 'Country ID', name: 'countryId', type: 'number', default: 0 },
	{ displayName: 'Zone ID', name: 'zoneId', type: 'number', default: 0, description: 'Region of the country; 0 = none' },
	{
		displayName: 'Custom Fields (JSON)',
		name: 'customFieldsJson',
		type: 'json',
		default: '{}',
		description: 'Address custom fields as {"custom_field_id": value}',
	},
];

function address(displayName: string, name: string, description: string, required = false): INodeProperties {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		placeholder: `Add ${displayName}`,
		required,
		default: {},
		description,
		options: [{ displayName, name: 'address', values: ADDRESS_FIELDS }],
	};
}

const CHECKOUT = ['create', 'quote'];

export const standardOrderFields: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'standardOrderId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: show(['get', 'delete', 'changeStatus']),
	},
	{
		displayName: 'Customer ID',
		name: 'standardCustomerId',
		type: 'number',
		default: 0,
		description: 'Registered customer, or 0 for a guest order',
		displayOptions: show(CHECKOUT),
	},
	...(
		[
			['First Name', 'standardFirstname'],
			['Last Name', 'standardLastname'],
			['Email', 'standardEmail'],
			['Telephone', 'standardTelephone'],
		] as Array<[string, string]>
	).map(
		([displayName, name]): INodeProperties => ({
			displayName,
			name,
			type: 'string',
			required: true,
			placeholder: name === 'standardEmail' ? 'name@email.com' : undefined,
			default: '',
			displayOptions: show(CHECKOUT),
		}),
	),
	{
		displayName: 'Products',
		name: 'standardProducts',
		type: 'fixedCollection',
		placeholder: 'Add Product',
		required: true,
		typeOptions: { multipleValues: true },
		default: {},
		displayOptions: show(CHECKOUT),
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
		...address('Payment Address', 'standardPaymentAddress', 'Billing address of the order', true),
		displayOptions: show(CHECKOUT),
	},
	{
		displayName: 'Order Fields',
		name: 'standardOrderFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(CHECKOUT),
		options: [
			{
				displayName: 'Affiliate ID',
				name: 'affiliateId',
				type: 'number',
				default: 0,
				description: 'Affiliate customer for the commission, 0 for none',
			},
			{ displayName: 'Comment', name: 'comment', type: 'string', typeOptions: { rows: 3 }, default: '' },
			{ displayName: 'Coupon Code', name: 'coupon', type: 'string', default: '' },
			{ displayName: 'Currency Code', name: 'currencyCode', type: 'string', default: '', placeholder: 'USD' },
			{
				displayName: 'Custom Fields (JSON)',
				name: 'customFieldsJson',
				type: 'json',
				default: '{}',
				description: 'Account custom fields as {"custom_field_id": value}',
			},
			{ displayName: 'Customer Group ID', name: 'customerGroupId', type: 'number', default: 0 },
			{ displayName: 'Gift Voucher Code to Use', name: 'voucher', type: 'string', default: '' },
			{
				displayName: 'Order Status ID',
				name: 'orderStatusId',
				type: 'number',
				default: 0,
				description: 'Status of the new order; 0 = the store setting Order Status',
			},
			{
				displayName: 'Payment Method Code',
				name: 'paymentMethod',
				type: 'string',
				default: '',
				placeholder: 'cod',
				description: 'Code from the Quote operation',
			},
			{ displayName: 'Reward Points to Use', name: 'reward', type: 'number', default: 0 },
			address('Shipping Address', 'shippingAddress', 'Defaults to the payment address'),
			{
				displayName: 'Shipping Method Code',
				name: 'shippingMethod',
				type: 'string',
				default: '',
				placeholder: 'flat.flat',
				description: 'Code from the Quote operation',
			},
			{ displayName: 'Store ID', name: 'storeId', type: 'number', default: 0 },
		],
	},
	{
		displayName: 'Order Status ID',
		name: 'standardOrderStatusId',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: show(['changeStatus']),
	},
	{
		displayName: 'Options',
		name: 'standardHistoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['changeStatus']),
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
				description: 'Whether to skip the anti-fraud extensions',
			},
		],
	},
];

function json(this: IExecuteFunctions, value: unknown, name: string, i: number): IDataObject {
	if (typeof value !== 'string') {
		return (value ?? {}) as IDataObject;
	}

	try {
		return JSON.parse(value === '' ? '{}' : value) as IDataObject;
	} catch {
		throw new NodeOperationError(this.getNode(), `${name} is not valid JSON`, { itemIndex: i });
	}
}

function addressForm(this: IExecuteFunctions, value: unknown, i: number): IDataObject | undefined {
	const fields = (value as IDataObject | undefined)?.address as IDataObject | undefined;

	if (!fields) {
		return undefined;
	}

	return {
		firstname: fields.firstname ?? '',
		lastname: fields.lastname ?? '',
		company: fields.company ?? '',
		address_1: fields.address1 ?? '',
		address_2: fields.address2 ?? '',
		city: fields.city ?? '',
		postcode: fields.postcode ?? '',
		country_id: fields.countryId ?? 0,
		zone_id: fields.zoneId ?? 0,
		custom_field: json.call(this, fields.customFieldsJson, 'Custom Fields (JSON)', i),
	};
}

/** shipping_methods: { flat: { title, quote: { flat: { code, title, cost, text } } } } → flat list */
function shippingMethods(data: IDataObject): IDataObject[] {
	const methods: IDataObject[] = [];

	for (const group of Object.values((data.shipping_methods ?? {}) as Record<string, IDataObject>)) {
		for (const quote of Object.values((group.quote ?? {}) as Record<string, IDataObject>)) {
			methods.push({ code: quote.code, title: quote.title, group: group.title, cost: quote.cost, text: quote.text });
		}
	}

	return methods;
}

function paymentMethods(data: IDataObject): IDataObject[] {
	return Object.values((data.payment_methods ?? {}) as Record<string, IDataObject>).map((method) => ({
		code: method.code,
		title: method.title,
	}));
}

async function orderInfo(this: IExecuteFunctions, session: StandardSession, orderId: number, i: number) {
	const data = await standardRequest.call(this, session, 'api/order/info', 'order', i, {}, { order_id: orderId });

	return data.order as IDataObject;
}

/** Create / Quote: customer → cart → addresses → coupon, voucher, reward → methods → order/add. */
async function checkout(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const fields = this.getNodeParameter('standardOrderFields', i, {}) as IDataObject;
	const storeId = fields.storeId ? Number(fields.storeId) : undefined;
	const session = await standardLogin.call(this, i, storeId);
	const call = (route: string, step: string, form: IDataObject = {}, allowErrors = false) =>
		standardRequest.call(this, session, route, step, i, form, {}, allowErrors);

	if (fields.currencyCode) {
		await call('api/currency', 'currency', { currency: fields.currencyCode });
	}

	await call('api/customer', 'customer', {
		customer_id: this.getNodeParameter('standardCustomerId', i, 0),
		customer_group_id: fields.customerGroupId ?? 0,
		firstname: this.getNodeParameter('standardFirstname', i),
		lastname: this.getNodeParameter('standardLastname', i),
		email: this.getNodeParameter('standardEmail', i),
		telephone: this.getNodeParameter('standardTelephone', i),
		custom_field: json.call(this, fields.customFieldsJson, 'Custom Fields (JSON)', i),
	});

	const products = ((this.getNodeParameter('standardProducts', i, {}) as IDataObject).product ?? []) as IDataObject[];

	if (products.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Add at least one product', { itemIndex: i });
	}

	for (const [index, product] of products.entries()) {
		await call('api/cart/add', `products.${index}`, {
			product_id: product.productId,
			quantity: product.quantity ?? 1,
			option: json.call(this, product.optionsJson, 'Options (JSON)', i),
		});
	}

	const paymentAddress = addressForm.call(this, this.getNodeParameter('standardPaymentAddress', i, {}), i);

	if (!paymentAddress) {
		throw new NodeOperationError(this.getNode(), 'Payment Address is required', { itemIndex: i });
	}

	await call('api/payment/address', 'payment_address', paymentAddress);

	const cart = await call('api/cart/products', 'products', {}, true);
	const requiresShipping = ((cart.products ?? []) as IDataObject[]).some((product) => String(product.shipping) === '1');

	if (requiresShipping) {
		const shippingAddress = addressForm.call(this, fields.shippingAddress, i) ?? paymentAddress;

		await call('api/shipping/address', 'shipping_address', shippingAddress);
	}

	if (fields.coupon) {
		await call('api/coupon', 'coupon', { coupon: fields.coupon });
	}

	if (fields.voucher) {
		await call('api/voucher', 'voucher', { voucher: fields.voucher });
	}

	if (Number(fields.reward ?? 0) > 0) {
		await call('api/reward', 'reward', { reward: fields.reward });
	}

	const shipping = requiresShipping ? shippingMethods(await call('api/shipping/methods', 'shipping_method')) : [];
	const payment = paymentMethods(await call('api/payment/methods', 'payment_method'));
	const shippingMethod = (fields.shippingMethod as string | undefined) ?? '';
	const paymentMethod = (fields.paymentMethod as string | undefined) ?? '';

	if (operation === 'quote') {
		// Chosen methods add their totals (shipping cost, payment fees)
		if (shippingMethod && requiresShipping) {
			await call('api/shipping/method', 'shipping_method', { shipping_method: shippingMethod });
		}

		if (paymentMethod) {
			await call('api/payment/method', 'payment_method', { payment_method: paymentMethod });
		}

		const totals = await call('api/cart/products', 'products', {}, true);

		return {
			products: totals.products,
			totals: totals.totals,
			warnings: totals.error ?? null,
			requires_shipping: requiresShipping,
			shipping_methods: shipping,
			payment_methods: payment,
		};
	}

	if (requiresShipping) {
		if (!shippingMethod) {
			throw new NodeOperationError(this.getNode(), 'Shipping Method Code is required', {
				itemIndex: i,
				description: `Available: ${shipping.map((method) => method.code).join(', ')}`,
			});
		}

		await call('api/shipping/method', 'shipping_method', { shipping_method: shippingMethod });
	}

	if (!paymentMethod) {
		throw new NodeOperationError(this.getNode(), 'Payment Method Code is required', {
			itemIndex: i,
			description: `Available: ${payment.map((method) => method.code).join(', ')}`,
		});
	}

	await call('api/payment/method', 'payment_method', { payment_method: paymentMethod });

	const form: IDataObject = { comment: fields.comment ?? '' };

	if (fields.orderStatusId) {
		form.order_status_id = fields.orderStatusId;
	}

	if (fields.affiliateId) {
		form.affiliate_id = fields.affiliateId;
	}

	const order = await call('api/order/add', 'order', form);

	return await orderInfo.call(this, session, Number(order.order_id), i);
}

/** Runs one item of the Standard OpenCart API branch. */
export async function executeStandardOrder(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const operation = this.getNodeParameter('standardOperation', i) as string;

	if (operation === 'create' || operation === 'quote') {
		return await checkout.call(this, operation, i);
	}

	const orderId = this.getNodeParameter('standardOrderId', i) as number;
	const session = await standardLogin.call(this, i);

	if (operation === 'get') {
		return await orderInfo.call(this, session, orderId, i);
	}

	if (operation === 'delete') {
		await standardRequest.call(this, session, 'api/order/delete', 'order', i, {}, { order_id: orderId });

		return { order_id: orderId, deleted: true };
	}

	const options = this.getNodeParameter('standardHistoryOptions', i, {}) as IDataObject;

	await standardRequest.call(this, session, 'api/order/history', 'order_status_id', i, {
		order_status_id: this.getNodeParameter('standardOrderStatusId', i),
		comment: options.comment ?? '',
		notify: options.notify ?? false,
		override: options.override ?? false,
	}, { order_id: orderId });

	return await orderInfo.call(this, session, orderId, i);
}
