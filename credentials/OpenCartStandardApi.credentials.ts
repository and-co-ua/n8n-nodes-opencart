import type { ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

/**
 * The API built into OpenCart 3 (catalog/controller/api/*): an API user from
 * System → Users → API. The node logs in (api/login) for every item and tests the credentials
 * (testedBy: n8n cannot apply test rules to the bare [] that api/login returns for a wrong key).
 */
export class OpenCartStandardApi implements ICredentialType {
	name = 'openCartStandardApi';

	displayName = 'OpenCart Standard API';

	icon: Icon = {
		light: 'file:../nodes/OpenCart/opencart.svg',
		dark: 'file:../nodes/OpenCart/opencart.dark.svg',
	};

	documentationUrl = 'https://github.com/and-co-ua/n8n-nodes-opencart?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Store URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://shop.example.com',
			description: 'Storefront URL of the OpenCart store, without index.php',
			required: true,
		},
		{
			displayName: 'API Username',
			name: 'username',
			type: 'string',
			default: 'Default',
			description: 'API Username from System → Users → API in the OpenCart admin panel',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'API Key of that user. Add the IP address of your n8n server on its IP Addresses tab.',
			required: true,
		},
	];
}
