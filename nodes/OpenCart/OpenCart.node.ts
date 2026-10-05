import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	buildCategoryRequest,
	categoryFields,
	categoryOperations,
} from './descriptions/CategoryDescription';
import type { ApiCall } from './descriptions/common';
import { buildLookupRequest, lookupFields, lookupOperations } from './descriptions/LookupDescription';
import {
	buildManufacturerRequest,
	manufacturerFields,
	manufacturerOperations,
} from './descriptions/ManufacturerDescription';
import { buildSystemRequest, systemFields, systemOperations } from './descriptions/SystemDescription';
import { openCartApiRequest, openCartApiRequestAllItems } from './GenericFunctions';
import { loadOptions } from './LoadOptions';

/** Resource → builder of the API call (action + params) for one item. See docs/API.md of the module. */
const BUILDERS: Record<
	string,
	(this: IExecuteFunctions, operation: string, i: number) => ApiCall
> = {
	category: buildCategoryRequest,
	lookup: buildLookupRequest,
	manufacturer: buildManufacturerRequest,
	system: buildSystemRequest,
};

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
						name: 'Category',
						value: 'category',
					},
					{
						name: 'Lookup',
						value: 'lookup',
						description: 'Reference lists: languages, statuses, countries and more',
					},
					{
						name: 'Manufacturer',
						value: 'manufacturer',
					},
					{
						name: 'System',
						value: 'system',
					},
				],
				default: 'category',
			},
			...categoryOperations,
			...categoryFields,
			...lookupOperations,
			...lookupFields,
			...manufacturerOperations,
			...manufacturerFields,
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
				const call = BUILDERS[resource].call(this, operation, i);

				let data: unknown;

				if (call.list && this.getNodeParameter('returnAll', i, false)) {
					data = await openCartApiRequestAllItems.call(this, resource, call.action, call.params, i);
				} else {
					if (call.list) {
						call.params.limit = this.getNodeParameter('limit', i, 50);
					}

					({ data } = await openCartApiRequest.call(this, resource, call.action, call.params, i));
				}

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
