import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { descriptionItem, languageField, listFields, listParams, sortOptions } from './common';

const TYPES = [
	{ name: 'Checkbox', value: 'checkbox' },
	{ name: 'Date', value: 'date' },
	{ name: 'Date & Time', value: 'datetime' },
	{ name: 'File', value: 'file' },
	{ name: 'Radio', value: 'radio' },
	{ name: 'Select', value: 'select' },
	{ name: 'Text', value: 'text' },
	{ name: 'Textarea', value: 'textarea' },
	{ name: 'Time', value: 'time' },
];

export const optionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['option'],
			},
		},
		options: [
			{ name: 'Create', value: 'create', description: 'Create an option', action: 'Create an option' },
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an option that no product uses',
				action: 'Delete an option',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an option with its values and all languages',
				action: 'Get an option',
			},
			{ name: 'Get Many', value: 'getAll', description: 'Get many options', action: 'Get many options' },
			{ name: 'Update', value: 'update', description: 'Update an option', action: 'Update an option' },
		],
		default: 'getAll',
	},
];

const VALUES: INodeProperties = {
	displayName: 'Values',
	name: 'values',
	type: 'fixedCollection',
	placeholder: 'Add Value',
	typeOptions: { multipleValues: true, sortable: true },
	default: {},
	description:
		'Option values. On update the list replaces the current values: give the Value ID to keep an existing value, values left out are removed.',
	options: [
		{
			displayName: 'Value',
			name: 'value',
			values: [
				{
					displayName: 'Value ID',
					name: 'optionValueId',
					type: 'number',
					default: 0,
					description: 'ID of an existing value to keep (update only); 0 adds a new value',
				},
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
					description:
						'Name in the selected language. Required for new values; empty keeps the name of an existing value.',
				},
				{
					displayName: 'Image',
					name: 'image',
					type: 'string',
					default: '',
					description: 'Image path relative to the image/ directory of the store',
				},
				{
					displayName: 'Sort Order',
					name: 'sortOrder',
					type: 'number',
					default: 0,
				},
			],
		},
	],
};

export const optionFields: INodeProperties[] = [
	{
		displayName: 'Option Name or ID',
		name: 'optionId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getOptions' },
		displayOptions: {
			show: {
				resource: ['option'],
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
				resource: ['option'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language. Other languages get a copy until translated.',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		required: true,
		options: TYPES,
		displayOptions: {
			show: {
				resource: ['option'],
				operation: ['create'],
			},
		},
		default: 'select',
		description: 'Select, Radio and Checkbox need at least one value',
	},
	languageField('option', ['create', 'update', 'getAll']),
	{
		...VALUES,
		displayOptions: {
			show: {
				resource: ['option'],
				operation: ['create', 'update'],
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
				resource: ['option'],
				operation: ['create'],
			},
		},
		default: {},
		options: [{ displayName: 'Sort Order', name: 'sortOrder', type: 'number', default: 0 }],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['option'],
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
				description: 'Name in the selected language',
			},
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'number', default: 0 },
			{ displayName: 'Type', name: 'type', type: 'options', options: TYPES, default: 'select' },
		],
	},
	...listFields('option'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['option'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' },
			{ displayName: 'Type', name: 'type', type: 'options', options: TYPES, default: 'select' },
		],
	},
	sortOptions(
		'option',
		[
			{ name: 'ID', value: 'option_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'name',
	),
];

export function buildOptionRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { option_id: this.getNodeParameter('optionId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
		}

		if (filters.type) {
			params.filter_type = filters.type;
		}

		return { action: 'list', params, list: true };
	}

	const fields =
		operation === 'create'
			? {
					...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
					name: this.getNodeParameter('name', i),
					type: this.getNodeParameter('type', i),
				}
			: (this.getNodeParameter('updateFields', i, {}) as IDataObject);

	const params: IDataObject = {};

	if (operation === 'update') {
		params.option_id = this.getNodeParameter('optionId', i);
	}

	const description = descriptionItem.call(this, i, fields, { name: 'name' });

	if (description) {
		params.descriptions = [description];
	}

	if (fields.type !== undefined) {
		params.type = fields.type;
	}

	if (fields.sortOrder !== undefined) {
		params.sort_order = fields.sortOrder;
	}

	const values = (this.getNodeParameter('values', i, {}) as IDataObject).value as IDataObject[] | undefined;

	// On update an untouched Values field keeps the current values
	if (values !== undefined || operation === 'create') {
		params.values = (values ?? []).map((value) => {
			const item: IDataObject = { image: value.image, sort_order: value.sortOrder };
			const name = descriptionItem.call(this, i, value.name ? { name: value.name } : {}, { name: 'name' });

			if (value.optionValueId) {
				item.option_value_id = value.optionValueId;
			}

			if (name) {
				item.descriptions = [name];
			}

			return item;
		});
	}

	return { action: operation, params };
}
