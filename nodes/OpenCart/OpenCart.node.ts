import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { systemFields, systemOperations } from './descriptions/SystemDescription';
import { openCartApiRequest } from './GenericFunctions';

/** Node operation → API action (snake_case, see docs/API.md of the module). */
const ACTIONS: Record<string, Record<string, string>> = {
	system: {
		ping: 'ping',
	},
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
						name: 'System',
						value: 'system',
					},
				],
				default: 'system',
			},
			...systemOperations,
			...systemFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const action = ACTIONS[resource][operation];

				const { data } = await openCartApiRequest.call(this, resource, action, {}, i);

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
