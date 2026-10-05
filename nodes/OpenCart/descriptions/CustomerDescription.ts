import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { ApiCall } from './common';
import { listFields, listParams, sortOptions, toApiDate } from './common';

/** Resource locator for a customer: search by name, e-mail or telephone, or ID. */
export const CUSTOMER_LOCATOR: INodeProperties = {
	displayName: 'Customer',
	name: 'customerId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchCustomers',
				searchable: true,
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: '15',
			validation: [
				{
					type: 'regex',
					properties: { regex: '^[0-9]+$', errorMessage: 'The customer ID must be a number' },
				},
			],
		},
	],
};

const ENTRY_OPERATIONS = ['getHistory', 'getTransactions', 'getRewards'];

export const customerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customer'],
			},
		},
		options: [
			{
				name: 'Add History',
				value: 'addHistory',
				description: 'Add a comment to the customer history',
				action: 'Add a history comment to a customer',
			},
			{
				name: 'Add Reward Points',
				value: 'addReward',
				description: 'Add or deduct reward points',
				action: 'Add reward points to a customer',
			},
			{
				name: 'Add Transaction',
				value: 'addTransaction',
				description: 'Add or deduct store credit',
				action: 'Add a transaction to a customer',
			},
			{ name: 'Create', value: 'create', description: 'Create a customer', action: 'Create a customer' },
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a customer with all their data',
				action: 'Delete a customer',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a customer with addresses',
				action: 'Get a customer',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get the history comments of a customer',
				action: 'Get the history of a customer',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many customers', action: 'Get many customers' },
			{
				name: 'Get Reward Points',
				value: 'getRewards',
				description: 'Get the reward point entries of a customer',
				action: 'Get the reward points of a customer',
			},
			{
				name: 'Get Transactions',
				value: 'getTransactions',
				description: 'Get the store credit transactions of a customer',
				action: 'Get the transactions of a customer',
			},
			{ name: 'Update', value: 'update', description: 'Update a customer', action: 'Update a customer' },
		],
		default: 'getAll',
	},
];

const ADDRESSES: INodeProperties = {
	displayName: 'Addresses',
	name: 'addresses',
	type: 'fixedCollection',
	placeholder: 'Add Address',
	typeOptions: { multipleValues: true },
	default: {},
	description:
		'Replaces the customer addresses. Give the Address ID to keep an existing address (only the filled fields change); addresses left out are removed.',
	options: [
		{
			displayName: 'Address',
			name: 'address',
			values: [
				{
					displayName: 'Address ID',
					name: 'addressId',
					type: 'number',
					default: 0,
					description: 'ID of an existing address to keep; 0 adds a new address',
				},
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
				{
					displayName: 'Default',
					name: 'default',
					type: 'boolean',
					default: false,
					description: 'Whether this is the default address of the customer',
				},
			],
		},
	],
};

const customerFieldOptions: INodeProperties[] = [
	ADDRESSES,
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
			'Defaults to the store default group. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Newsletter',
		name: 'newsletter',
		type: 'boolean',
		default: false,
		description: 'Whether the customer is subscribed to the newsletter',
	},
	{
		displayName: 'Password',
		name: 'password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		description:
			'4–40 characters. On create without it a random password is set and the customer uses "Forgotten password".',
	},
	{
		displayName: 'Safe',
		name: 'safe',
		type: 'boolean',
		default: false,
		description: 'Whether to skip anti-fraud checks for this customer',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'boolean',
		default: true,
		description: 'Whether the customer can log in',
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
];

export const customerFields: INodeProperties[] = [
	{
		...CUSTOMER_LOCATOR,
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: [
					'get',
					'delete',
					'update',
					'addHistory',
					'addTransaction',
					'addReward',
					...ENTRY_OPERATIONS,
				],
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
					resource: ['customer'],
					operation: ['create'],
				},
			},
			default: '',
		}),
	),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['create'],
			},
		},
		default: {},
		options: customerFieldOptions,
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			...customerFieldOptions,
			{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
			{ displayName: 'First Name', name: 'firstname', type: 'string', default: '' },
			{ displayName: 'Last Name', name: 'lastname', type: 'string', default: '' },
			{ displayName: 'Telephone', name: 'telephone', type: 'string', default: '' },
		],
	},

	// History, transactions, rewards
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addHistory'],
			},
		},
		default: '',
	},
	{
		displayName: 'Description',
		name: 'entryDescription',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addTransaction', 'addReward'],
			},
		},
		default: '',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		typeOptions: { numberPrecision: 4 },
		required: true,
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addTransaction'],
			},
		},
		default: 0,
		description: 'Store credit to add; negative to deduct',
	},
	{
		displayName: 'Points',
		name: 'points',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addReward'],
			},
		},
		default: 0,
		description: 'Points to add; negative to deduct',
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addTransaction', 'addReward'],
			},
		},
		default: 0,
		description: 'Related order, 0 for none',
	},
	{
		displayName: 'Notify Customer',
		name: 'notify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['addTransaction', 'addReward'],
			},
		},
		default: true,
		description: 'Whether to send the e-mail the admin panel sends for this entry',
	},
	...listFields('customer', ['getAll', ...ENTRY_OPERATIONS]),

	// Get Many
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['customer'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Customer Group Name or ID',
				name: 'customerGroupId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getCustomerGroups' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{ displayName: 'Date Added From', name: 'dateFrom', type: 'dateTime', default: '' },
			{ displayName: 'Date Added To', name: 'dateTo', type: 'dateTime', default: '' },
			{
				displayName: 'Email (Exact)',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{ displayName: 'IP', name: 'ip', type: 'string', default: '' },
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{
				displayName: 'Newsletter',
				name: 'newsletter',
				type: 'boolean',
				default: true,
				description: 'Whether to return only subscribed (true) or only unsubscribed (false) customers',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Name, e-mail or telephone contains',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'boolean',
				default: true,
				description: 'Whether to return only enabled (true) or only disabled (false) customers',
			},
		],
	},
	sortOptions(
		'customer',
		[
			{ name: 'Customer Group', value: 'customer_group' },
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Email', value: 'email' },
			{ name: 'ID', value: 'customer_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Status', value: 'status' },
		],
		'name',
	),
];

function addressParams(rows: IDataObject[]): IDataObject[] {
	return rows.map((row) => {
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

		if (row.addressId) {
			item.address_id = row.addressId;
		}

		// Existing addresses change only the filled fields; new ones send everything
		for (const [nodeName, apiName] of Object.entries(map)) {
			if (row[nodeName] !== '' || !row.addressId) {
				item[apiName] = row[nodeName];
			}
		}

		if (row.countryId !== '' && row.countryId !== undefined) {
			item.country_id = row.countryId;
		}

		item.zone_id = row.zoneId;
		item.default = row.default;

		return item;
	});
}

function customerParams(this: IExecuteFunctions, i: number, fields: IDataObject): IDataObject {
	const params: IDataObject = {};
	const map: Record<string, string> = {
		firstname: 'firstname',
		lastname: 'lastname',
		email: 'email',
		telephone: 'telephone',
		password: 'password',
		customerGroupId: 'customer_group_id',
		storeId: 'store_id',
		newsletter: 'newsletter',
		status: 'status',
		safe: 'safe',
	};

	for (const [nodeName, apiName] of Object.entries(map)) {
		if (fields[nodeName] !== undefined && fields[nodeName] !== '') {
			params[apiName] = fields[nodeName];
		}
	}

	if (fields.addresses !== undefined) {
		params.addresses = addressParams(((fields.addresses as IDataObject).address as IDataObject[]) ?? []);
	}

	if (fields.customFieldsJson !== undefined) {
		let value: unknown = fields.customFieldsJson;

		if (typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Custom Fields (JSON) is not valid JSON', { itemIndex: i });
			}
		}

		params.custom_fields = value as IDataObject;
	}

	return params;
}

export function buildCustomerRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	const customerId = () => this.getNodeParameter('customerId', i, undefined, { extractValue: true });

	switch (operation) {
		case 'get':
		case 'delete':
			return { action: operation, params: { customer_id: customerId() } };

		case 'getHistory':
		case 'getTransactions':
		case 'getRewards':
			return {
				action: { getHistory: 'history', getTransactions: 'transactions', getRewards: 'rewards' }[operation],
				params: { customer_id: customerId() },
				list: true,
			};

		case 'addHistory':
			return {
				action: 'add_history',
				params: { customer_id: customerId(), comment: this.getNodeParameter('comment', i) },
			};

		case 'addTransaction':
		case 'addReward': {
			const params: IDataObject = {
				customer_id: customerId(),
				description: this.getNodeParameter('entryDescription', i),
				order_id: this.getNodeParameter('orderId', i, 0),
				notify: this.getNodeParameter('notify', i, true),
			};

			if (operation === 'addTransaction') {
				params.amount = this.getNodeParameter('amount', i);
			} else {
				params.points = this.getNodeParameter('points', i);
			}

			return { action: operation === 'addTransaction' ? 'add_transaction' : 'add_reward', params };
		}

		case 'getAll': {
			const params = listParams.call(this, i);
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
			const map: Record<string, string> = {
				name: 'filter_name',
				email: 'filter_email',
				search: 'filter_search',
				customerGroupId: 'filter_customer_group_id',
				status: 'filter_status',
				newsletter: 'filter_newsletter',
				ip: 'filter_ip',
			};

			for (const [nodeName, apiName] of Object.entries(map)) {
				if (filters[nodeName] !== undefined && filters[nodeName] !== '') {
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

		case 'create':
			return {
				action: 'create',
				params: customerParams.call(this, i, {
					...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
					firstname: this.getNodeParameter('firstname', i),
					lastname: this.getNodeParameter('lastname', i),
					email: this.getNodeParameter('email', i),
					telephone: this.getNodeParameter('telephone', i),
				}),
			};

		default: {
			const params = customerParams.call(this, i, this.getNodeParameter('updateFields', i, {}) as IDataObject);

			params.customer_id = customerId();

			return { action: 'update', params };
		}
	}
}
