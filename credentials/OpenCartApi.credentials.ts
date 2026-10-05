import type {
	IAuthenticate,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class OpenCartApi implements ICredentialType {
	name = 'openCartApi';

	displayName = 'OpenCart API';

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
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Key from Extensions → Modules → n8n API in the OpenCart admin panel',
			required: true,
		},
		{
			displayName: 'Send API Key As',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'X-Api-Key Header',
					value: 'header',
				},
				{
					name: 'Bearer Token',
					value: 'bearer',
					description: 'Authorization: Bearer header',
				},
				{
					name: 'Request Body Field',
					value: 'body',
					description: 'For hosts that strip custom and Authorization headers',
				},
				{
					name: 'Query String Parameter',
					value: 'query',
					description:
						'Last resort; must be enabled in the module settings. URLs end up in server logs.',
				},
			],
			default: 'header',
		},
		{
			displayName: 'Endpoint Route',
			name: 'route',
			type: 'options',
			options: [
				{
					name: 'Api/n8n (Recommended)',
					value: 'api/n8n',
					description: 'Works while the store is in maintenance mode',
				},
				{
					name: 'Extension/module/n8n_api',
					value: 'extension/module/n8n_api',
					description: 'Use only if the n8n_api event is disabled in the store',
				},
			],
			default: 'api/n8n',
		},
	];

	authenticate: IAuthenticate = async (credentials, requestOptions) => {
		const apiKey = credentials.apiKey as string;
		const headers = { ...(requestOptions.headers ?? {}) };

		switch (credentials.authMethod) {
			case 'bearer':
				headers.Authorization = `Bearer ${apiKey}`;
				return { ...requestOptions, headers };
			case 'body':
				return {
					...requestOptions,
					headers,
					body: { ...((requestOptions.body as IDataObject) ?? {}), api_key: apiKey },
				};
			case 'query':
				return { ...requestOptions, headers, qs: { ...(requestOptions.qs ?? {}), api_key: apiKey } };
			default:
				headers['X-Api-Key'] = apiKey;
				return { ...requestOptions, headers };
		}
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url.replace(/\\/+$/, "")}}',
			url: '/index.php',
			qs: {
				route: '={{$credentials.route}}',
			},
			method: 'POST',
			body: {
				resource: 'system',
				action: 'ping',
				params: {},
			},
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'success',
					value: false,
					message: 'The store rejected the request. Check the API key and the module settings.',
				},
			},
		],
	};
}
