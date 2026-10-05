import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { descriptionItem, languageField, listFields, listParams, sortOptions } from './common';

function operations(resource: string, label: string, deleteNote: string): INodeProperties {
	return {
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [resource],
			},
		},
		options: [
			{ name: 'Create', value: 'create', description: `Create an ${label}`, action: `Create an ${label}` },
			{ name: 'Delete', value: 'delete', description: deleteNote, action: `Delete an ${label}` },
			{ name: 'Get', value: 'get', description: `Get an ${label} with all languages`, action: `Get an ${label}` },
			{ name: 'Get Many', value: 'getAll', description: `Get many ${label}s`, action: `Get many ${label}s` },
			{ name: 'Update', value: 'update', description: `Update an ${label}`, action: `Update an ${label}` },
		],
		default: 'getAll',
	};
}

const SORT_ORDER: INodeProperties = {
	displayName: 'Sort Order',
	name: 'sortOrder',
	type: 'number',
	default: 0,
};

const ATTRIBUTE_GROUP_PICKER = {
	displayName: 'Attribute Group Name or ID',
	type: 'options' as const,
	typeOptions: { loadOptionsMethod: 'getAttributeGroups' },
	default: '',
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
};

export const attributeGroupOperations: INodeProperties[] = [
	operations('attribute_group', 'attribute group', 'Delete an attribute group that has no attributes'),
];

export const attributeGroupFields: INodeProperties[] = [
	{
		...ATTRIBUTE_GROUP_PICKER,
		name: 'attributeGroupId',
		required: true,
		displayOptions: {
			show: {
				resource: ['attribute_group'],
				operation: ['get', 'delete', 'update'],
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
				resource: ['attribute_group'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language. Other languages get a copy until translated.',
	},
	languageField('attribute_group', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['attribute_group'],
				operation: ['create'],
			},
		},
		default: {},
		options: [SORT_ORDER],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['attribute_group'],
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
			SORT_ORDER,
		],
	},
	...listFields('attribute_group'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['attribute_group'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Name Contains',
				name: 'name',
				type: 'string',
				default: '',
			},
		],
	},
	sortOptions(
		'attribute_group',
		[
			{ name: 'ID', value: 'attribute_group_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'name',
	),
];

export const attributeOperations: INodeProperties[] = [
	operations('attribute', 'attribute', 'Delete an attribute that no product uses'),
];

export const attributeFields: INodeProperties[] = [
	{
		displayName: 'Attribute Name or ID',
		name: 'attributeId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getAttributes' },
		displayOptions: {
			show: {
				resource: ['attribute'],
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
				resource: ['attribute'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language. Other languages get a copy until translated.',
	},
	{
		...ATTRIBUTE_GROUP_PICKER,
		name: 'attributeGroupId',
		required: true,
		displayOptions: {
			show: {
				resource: ['attribute'],
				operation: ['create'],
			},
		},
	},
	languageField('attribute', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['attribute'],
				operation: ['create'],
			},
		},
		default: {},
		options: [SORT_ORDER],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['attribute'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{ ...ATTRIBUTE_GROUP_PICKER, name: 'attributeGroupId' },
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name in the selected language',
			},
			SORT_ORDER,
		],
	},
	...listFields('attribute'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['attribute'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{ ...ATTRIBUTE_GROUP_PICKER, name: 'attributeGroupId' },
			{
				displayName: 'Name Contains',
				name: 'name',
				type: 'string',
				default: '',
			},
		],
	},
	sortOptions(
		'attribute',
		[
			{ name: 'Group, Then Name', value: 'attribute_group' },
			{ name: 'ID', value: 'attribute_id' },
			{ name: 'Name', value: 'name' },
			{ name: 'Sort Order', value: 'sort_order' },
		],
		'attribute_group',
	),
];

/** Shared builder: both resources are a sort order plus a translated name; attribute adds its group. */
function buildRequest(
	this: IExecuteFunctions,
	resource: 'attribute_group' | 'attribute',
	operation: string,
	i: number,
): ApiCall {
	const idName = resource === 'attribute' ? 'attributeId' : 'attributeGroupId';
	const idParam = `${resource}_id`;

	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { [idParam]: this.getNodeParameter(idName, i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
		}

		if (filters.attributeGroupId) {
			params.filter_attribute_group_id = filters.attributeGroupId;
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
		params[idParam] = this.getNodeParameter(idName, i);
	}

	if (resource === 'attribute') {
		const groupId =
			operation === 'create' ? this.getNodeParameter('attributeGroupId', i) : fields.attributeGroupId;

		if (groupId !== undefined && groupId !== '') {
			params.attribute_group_id = groupId;
		}
	}

	const description = descriptionItem.call(this, i, fields, { name: 'name' });

	if (description) {
		params.descriptions = [description];
	}

	if (fields.sortOrder !== undefined) {
		params.sort_order = fields.sortOrder;
	}

	return { action: operation, params };
}

export function buildAttributeGroupRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	return buildRequest.call(this, 'attribute_group', operation, i);
}

export function buildAttributeRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	return buildRequest.call(this, 'attribute', operation, i);
}
