import type { ICredentialTestRequest, ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

/**
 * The API built into OpenCart 3 (catalog/controller/api/*): an API user from
 * System → Users → API. The node logs in (api/login) for every item, see StandardFunctions.ts.
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

	// api/login returns api_token on success; [] for a wrong user or key, an error for a wrong IP
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url.replace(/\\/+$/, "")}}',
			url: '/index.php',
			qs: { route: 'api/login' },
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: {
				username: '={{$credentials.username}}',
				key: '={{$credentials.apiKey}}',
			},
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'api_token',
					value: undefined,
					message:
						'Login failed. Check the API username and key, and that the IP address of the n8n server is on the IP Addresses tab of the API user (System → Users → API).',
				},
			},
		],
	};
}
