import type { INodeProperties } from 'n8n-workflow';

/** Lookup types that return translated names and accept language_id. */
const TRANSLATED = [
	'order_statuses',
	'return_statuses',
	'return_reasons',
	'return_actions',
	'customer_groups',
	'voucher_themes',
];

export const lookupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['lookup'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get a reference list such as languages, order statuses or countries',
				action: 'Get a reference list',
			},
		],
		default: 'getAll',
	},
];

export const lookupFields: INodeProperties[] = [
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['getAll'],
			},
		},
		// Values are the API actions of the lookup resource
		options: [
			{ name: 'Countries', value: 'countries' },
			{ name: 'Currencies', value: 'currencies' },
			{ name: 'Customer Groups', value: 'customer_groups' },
			{ name: 'Languages', value: 'languages' },
			{ name: 'Layouts', value: 'layouts' },
			{ name: 'Order Statuses', value: 'order_statuses' },
			{ name: 'Return Actions', value: 'return_actions' },
			{ name: 'Return Reasons', value: 'return_reasons' },
			{ name: 'Return Statuses', value: 'return_statuses' },
			{ name: 'Stores', value: 'stores' },
			{ name: 'Tax Classes', value: 'tax_classes' },
			{ name: 'Voucher Themes', value: 'voucher_themes' },
			{ name: 'Zones', value: 'zones' },
		],
		default: 'order_statuses',
	},
	{
		displayName: 'Country Name or ID',
		name: 'countryId',
		type: 'options',
		description:
			'Return only zones of this country. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getCountries',
		},
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['getAll'],
				type: ['zones'],
			},
		},
		default: '',
	},
	{
		displayName: 'Language Name or ID',
		name: 'languageId',
		type: 'options',
		description:
			'Language of the names. Leave empty for the store default. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getLanguages',
		},
		displayOptions: {
			show: {
				resource: ['lookup'],
				operation: ['getAll'],
				type: TRANSLATED,
			},
		},
		default: '',
	},
];
