import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

/** What a resource builder returns: the API action, its params and whether it is a paginated list. */
export interface ApiCall {
	action: string;
	params: IDataObject;
	list?: boolean;
}

export function languageField(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Language Name or ID',
		name: 'languageId',
		type: 'options',
		description:
			'Language of the texts. Leave empty for the store default. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getLanguages',
		},
		displayOptions: {
			show: {
				resource: [resource],
				operation: operations,
			},
		},
		default: '',
	};
}

export function listFields(resource: string): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: false,
			description: 'Whether to return all results or only up to a given limit',
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
					returnAll: [false],
				},
			},
			typeOptions: {
				minValue: 1,
				maxValue: 1000,
			},
			default: 50,
			description: 'Max number of results to return',
		},
	];
}

export function sortOptions(resource: string, sorts: Array<{ name: string; value: string }>, defaultSort: string): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				options: sorts,
				default: defaultSort,
			},
			{
				displayName: 'Sort Direction',
				name: 'order',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'asc',
			},
		],
	};
}

/** Language and sort params shared by list actions. */
export function listParams(this: IExecuteFunctions, i: number): IDataObject {
	const params: IDataObject = {};
	const languageId = this.getNodeParameter('languageId', i, '') as string | number;
	const options = this.getNodeParameter('options', i, {}) as IDataObject;

	if (languageId !== '') {
		params.language_id = languageId;
	}

	if (options.sort) {
		params.sort = options.sort;
	}

	if (options.order) {
		params.order = options.order;
	}

	return params;
}

/**
 * Splits node fields into a description item (for the selected language) and the rest.
 * Field names are camelCase in the node and snake_case in the API.
 */
export function descriptionItem(
	this: IExecuteFunctions,
	i: number,
	fields: IDataObject,
	descriptionFields: Record<string, string>,
): IDataObject | null {
	const languageId = this.getNodeParameter('languageId', i, '') as string | number;
	const item: IDataObject = {};

	for (const [nodeName, apiName] of Object.entries(descriptionFields)) {
		if (fields[nodeName] !== undefined) {
			item[apiName] = fields[nodeName];
		}
	}

	if (Object.keys(item).length === 0) {
		return null;
	}

	if (languageId !== '') {
		item.language_id = languageId;
	}

	return item;
}

/** SEO keyword for the selected language in the default store. */
export function seoUrlItem(this: IExecuteFunctions, i: number, keyword: unknown): IDataObject[] | undefined {
	if (keyword === undefined) {
		return undefined;
	}

	const languageId = this.getNodeParameter('languageId', i, '') as string | number;
	const item: IDataObject = { store_id: 0, keyword };

	if (languageId !== '') {
		item.language_id = languageId;
	}

	return [item];
}
