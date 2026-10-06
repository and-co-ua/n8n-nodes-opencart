import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

import type { ApiCall } from './common';

export const imageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['image'],
			},
		},
		options: [
			{
				name: 'Resize',
				value: 'resize',
				description: 'Get the URL of a resized copy of a store image',
				action: 'Resize an image',
			},
		],
		default: 'resize',
	},
];

const show = { resource: ['image'], operation: ['resize'] };

export const imageFields: INodeProperties[] = [
	{
		displayName: 'Image Path',
		name: 'image',
		type: 'string',
		required: true,
		displayOptions: { show },
		default: '',
		placeholder: 'catalog/demo/iphone_1.jpg',
		description: 'Path relative to the image/ directory of the store, as in the image field of a product',
	},
	{
		displayName: 'Width',
		name: 'width',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1, maxValue: 10000 },
		displayOptions: { show },
		default: 200,
	},
	{
		displayName: 'Height',
		name: 'height',
		type: 'number',
		required: true,
		typeOptions: { minValue: 1, maxValue: 10000 },
		displayOptions: { show },
		default: 200,
	},
];

export function buildImageRequest(this: IExecuteFunctions, operation: string, i: number): ApiCall {
	return {
		action: operation,
		params: {
			image: this.getNodeParameter('image', i),
			width: this.getNodeParameter('width', i),
			height: this.getNodeParameter('height', i),
		},
	};
}
