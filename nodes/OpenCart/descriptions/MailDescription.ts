import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';

export const mailOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['mail'],
			},
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				description: 'Send an e-mail to a group of customers',
				action: 'Send a mailing',
			},
		],
		default: 'send',
	},
];

const show = { resource: ['mail'], operation: ['send'] };

export const mailFields: INodeProperties[] = [
	{
		displayName: 'To',
		name: 'to',
		type: 'options',
		required: true,
		displayOptions: { show },
		options: [
			{ name: 'Affiliates', value: 'affiliate', description: 'Customers with the given IDs' },
			{ name: 'All Affiliates', value: 'affiliate_all', description: 'Enabled affiliates' },
			{ name: 'All Customers', value: 'customer_all' },
			{ name: 'Customer Group', value: 'customer_group' },
			{ name: 'Customers', value: 'customer', description: 'Customers with the given IDs' },
			{ name: 'Newsletter Subscribers', value: 'newsletter' },
			{ name: 'Products', value: 'product', description: 'Everyone who ordered one of the products' },
		],
		default: 'newsletter',
	},
	{
		displayName: 'Customer Group Name or ID',
		name: 'customerGroupId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getCustomerGroups' },
		displayOptions: { show: { ...show, to: ['customer_group'] } },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Customer IDs',
		name: 'customerIds',
		type: 'string',
		required: true,
		displayOptions: { show: { ...show, to: ['customer', 'affiliate'] } },
		default: '',
		placeholder: '1, 5, 12',
		description: 'Comma-separated customer IDs',
	},
	{
		displayName: 'Product IDs',
		name: 'productIds',
		type: 'string',
		required: true,
		displayOptions: { show: { ...show, to: ['product'] } },
		default: '',
		placeholder: '40, 42',
		description: 'Comma-separated product IDs',
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		required: true,
		displayOptions: { show },
		default: '',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		typeOptions: { rows: 6 },
		displayOptions: { show },
		default: '',
		description: 'HTML body of the e-mail',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show },
		default: {},
		options: [
			{
				displayName: 'Batch Size',
				name: 'batchSize',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 10,
				description:
					'E-mails per request. The node sends batches until all recipients got the e-mail; lower it if the store times out.',
			},
			{
				displayName: 'Store Name or ID',
				name: 'storeId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getStores' },
				default: '',
				description:
					'Store whose name and e-mail are the sender. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	},
];

function idList(value: unknown): string[] {
	return String(value)
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id !== '');
}

export function buildMailRequest(this: IExecuteFunctions, _operation: string, i: number): ApiCall {
	const to = this.getNodeParameter('to', i) as string;
	const options = this.getNodeParameter('options', i, {}) as IDataObject;
	const params: IDataObject = {
		to,
		subject: this.getNodeParameter('subject', i),
		message: this.getNodeParameter('message', i),
		limit: options.batchSize ?? 10,
	};

	if (to === 'customer_group') {
		params.customer_group_id = this.getNodeParameter('customerGroupId', i);
	} else if (to === 'customer' || to === 'affiliate') {
		params.customer_ids = idList(this.getNodeParameter('customerIds', i));
	} else if (to === 'product') {
		params.product_ids = idList(this.getNodeParameter('productIds', i));
	}

	if (options.storeId !== undefined && options.storeId !== '') {
		params.store_id = options.storeId;
	}

	return { action: 'send', params, batched: true };
}
