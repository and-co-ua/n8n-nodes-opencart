import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';
import { descriptionItem, languageField, listFields, listParams, sortOptions } from './common';

export const downloadOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['download'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Upload a file and create a download',
				action: 'Create a download',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a download that no product uses',
				action: 'Delete a download',
			},
			{ name: 'Get', value: 'get', description: 'Get a download', action: 'Get a download' },
			{ name: 'Get Many', value: 'getAll', description: 'Get many downloads', action: 'Get many downloads' },
			{
				name: 'Update',
				value: 'update',
				description: 'Update a download or replace its file',
				action: 'Update a download',
			},
		],
		default: 'getAll',
	},
];

export const downloadFields: INodeProperties[] = [
	{
		displayName: 'Download Name or ID',
		name: 'downloadId',
		type: 'options',
		required: true,
		typeOptions: { loadOptionsMethod: 'getDownloads' },
		displayOptions: {
			show: {
				resource: ['download'],
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
				resource: ['download'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name in the selected language (3–64 characters). Other languages get a copy.',
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['download'],
				operation: ['create'],
			},
		},
		default: 'data',
		hint: 'The name of the input binary field containing the file to upload',
	},
	languageField('download', ['create', 'update', 'getAll']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['download'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Mask',
				name: 'mask',
				type: 'string',
				default: '',
				description: 'File name the customer sees. Defaults to the uploaded file name.',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['download'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Mask',
				name: 'mask',
				type: 'string',
				default: '',
				description: 'File name the customer sees',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name in the selected language (3–64 characters)',
			},
			{
				displayName: 'Replace File From Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the input binary field with the new file',
			},
		],
	},
	...listFields('download'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['download'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [{ displayName: 'Name Contains', name: 'name', type: 'string', default: '' }],
	},
	sortOptions(
		'download',
		[
			{ name: 'Date Added', value: 'date_added' },
			{ name: 'ID', value: 'download_id' },
			{ name: 'Name', value: 'name' },
		],
		'name',
	),
];

/** Reads an input binary field as the API `file` object. */
async function fileParam(this: IExecuteFunctions, i: number, propertyName: string): Promise<IDataObject> {
	const binary = this.helpers.assertBinaryData(i, propertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(i, propertyName);

	return {
		content: buffer.toString('base64'),
		name: binary.fileName ?? 'file',
		mime_type: binary.mimeType,
	};
}

export async function buildDownloadRequest(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ApiCall> {
	if (operation === 'get' || operation === 'delete') {
		return { action: operation, params: { download_id: this.getNodeParameter('downloadId', i) } };
	}

	if (operation === 'getAll') {
		const params = listParams.call(this, i);
		const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

		if (filters.name) {
			params.filter_name = filters.name;
		}

		return { action: 'list', params, list: true };
	}

	const params: IDataObject = {};
	let fields: IDataObject;

	if (operation === 'create') {
		fields = {
			...(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
			name: this.getNodeParameter('name', i),
		};
		params.file = await fileParam.call(this, i, this.getNodeParameter('binaryPropertyName', i) as string);
	} else {
		fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
		params.download_id = this.getNodeParameter('downloadId', i);

		if (fields.binaryPropertyName) {
			params.file = await fileParam.call(this, i, fields.binaryPropertyName as string);
		}
	}

	const description = descriptionItem.call(this, i, fields, { name: 'name' });

	if (description) {
		params.descriptions = [description];
	}

	if (fields.mask) {
		params.mask = fields.mask;
	}

	return { action: operation, params };
}
