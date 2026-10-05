import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { languageField, listFields, listParams, sortOptions, toApiDate } from './common';
import { CUSTOMER_LOCATOR } from './CustomerDescription';

const TYPES = [
	{ name: 'Customer', value: 'customer' },
	{ name: 'Affiliate', value: 'affiliate' },
];

export const customerApprovalOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customer_approval'],
			},
		},
		options: [
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve a pending customer or affiliate',
				action: 'Approve a customer',
			},
			{
				name: 'Deny',
				value: 'deny',
				description: 'Deny a pending customer or affiliate',
				action: 'Deny a customer',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get pending approvals',
				action: 'Get many pending approvals',
			},
		],
		default: 'getAll',
	},
];

export const customerApprovalFields: INodeProperties[] = [
	{
		...CUSTOMER_LOCATOR,
		displayOptions: {
			show: {
				resource: ['customer_approval'],
				operation: ['approve', 'deny'],
			},
		},
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: TYPES,
		displayOptions: {
			show: {
				resource: ['customer_approval'],
				operation: ['approve', 'deny'],
			},
		},
		default: 'customer',
		description: 'Whether to decide on the customer account or on the affiliate request',
	},
	{
		displayName: 'Notify Customer',
		name: 'notify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['customer_approval'],
				operation: ['approve', 'deny'],
			},
		},
		default: true,
		description: "Whether to send the admin panel's approve / deny e-mail",
	},
	languageField('customer_approval', ['getAll']),
	...listFields('customer_approval'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['customer_approval'],
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
				displayName: 'Email Contains',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{ displayName: 'Type', name: 'type', type: 'options', options: TYPES, default: 'customer' },
		],
	},
	sortOptions(
		'customer_approval',
		[
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'Email', value: 'email' },
			{ name: 'Name', value: 'name' },
			{ name: 'Type', value: 'type' },
		],
		'date_added',
	),
];

export function buildCustomerApprovalRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'approve' || operation === 'deny') {
		return {
			action: operation,
			params: {
				customer_id: this.getNodeParameter('customerId', i, undefined, { extractValue: true }),
				type: this.getNodeParameter('type', i),
				notify: this.getNodeParameter('notify', i, true),
			},
		};
	}

	const params = listParams.call(this, i);
	const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
	const map: Record<string, string> = {
		type: 'filter_type',
		name: 'filter_name',
		email: 'filter_email',
		customerGroupId: 'filter_customer_group_id',
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
