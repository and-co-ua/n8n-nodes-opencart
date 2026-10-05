import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { lookupFields, lookupOperations } from './descriptions/LookupDescription';
import { systemFields, systemOperations } from './descriptions/SystemDescription';
import { openCartApiRequest } from './GenericFunctions';
import { loadOptions } from './LoadOptions';

/**
 * Builds the API action and params for one item (see docs/API.md of the module).
 */
function buildRequest(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): { action: string; params: IDataObject } {
	if (resource === 'lookup') {
		// The Type value is the lookup action; the extra parameters are shown only where they apply
		const action = this.getNodeParameter('type', i) as string;
		const params: IDataObject = {};
		const countryId = this.getNodeParameter('countryId', i, '') as string | number;
		const languageId = this.getNodeParameter('languageId', i, '') as string | number;

		if (action === 'zones' && countryId !== '') {
			params.country_id = countryId;
		}

		if (languageId !== '') {
			params.language_id = languageId;
		}

		return { action, params };
	}

	return { action: operation, params: {} };
}

export class OpenCart implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenCart',
		name: 'openCart',
		icon: { light: 'file:opencart.svg', dark: 'file:opencart.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage an OpenCart 3 store through the n8n API module',
		defaults: {
			name: 'OpenCart',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'openCartApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Lookup',
						value: 'lookup',
						description: 'Reference lists: languages, statuses, countries and more',
					},
					{
						name: 'System',
						value: 'system',
					},
				],
				default: 'system',
			},
			...lookupOperations,
			...lookupFields,
			...systemOperations,
			...systemFields,
		],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const { action, params } = buildRequest.call(this, resource, operation, i);

				const { data } = await openCartApiRequest.call(this, resource, action, params, i);

				const rows = Array.isArray(data) ? data : [data ?? {}];

				for (const row of rows) {
					returnData.push({ json: row as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as JsonObject).message as string },
						pairedItem: { item: i },
					});
					continue;
				}

				// Both constructors return the error unchanged if it already is of that class.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
