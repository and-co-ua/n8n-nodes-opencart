import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

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
		// Credentials, resources and operations are added in 0.2.0.
		properties: [],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return [this.getInputData()];
	}
}
