import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

/** API contract version this node implements (opencart repo, docs/API.md). */
export const SUPPORTED_API_VERSION = 1;

export interface OpenCartResult {
	data: unknown;
	meta: IDataObject;
}

interface Envelope {
	success: boolean;
	data?: unknown;
	meta?: IDataObject;
	error?: { code: string; message: string; details?: IDataObject };
}

function isEnvelope(body: unknown): body is Envelope {
	return (
		typeof body === 'object' &&
		body !== null &&
		typeof (body as IDataObject).success === 'boolean'
	);
}

/**
 * Calls one API action: POST {url}/index.php?route=... with { resource, action, params }.
 * Unwraps the envelope and turns every failure into a readable node error.
 */
export async function openCartApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	resource: string,
	action: string,
	params: IDataObject = {},
	itemIndex = 0,
): Promise<OpenCartResult> {
	const credentials = await this.getCredentials('openCartApi');
	const baseUrl = (credentials.url as string).trim().replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}/index.php`,
		qs: { route: (credentials.route as string) || 'api/n8n' },
		body: { resource, action, params },
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	let response: { statusCode: number; body: unknown };

	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'openCartApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}

	const { statusCode, body } = response;

	if (!isEnvelope(body)) {
		throw new NodeApiError(this.getNode(), { statusCode, body: String(body).slice(0, 500) } as JsonObject, {
			itemIndex,
			httpCode: String(statusCode),
			message: `The store did not return an n8n API response (HTTP ${statusCode})`,
			description:
				'Check that the Store URL is correct and the n8n API module is installed and enabled. ' +
				'If the n8n_api event is disabled in Extensions → Events, enable it or switch the credential ' +
				'Endpoint Route to extension/module/n8n_api.',
		});
	}

	const apiVersion = body.meta?.api_version;

	if (typeof apiVersion === 'number' && apiVersion !== SUPPORTED_API_VERSION) {
		throw new NodeOperationError(
			this.getNode(),
			`Incompatible API version: the store uses version ${apiVersion}, this node supports version ${SUPPORTED_API_VERSION}`,
			{
				itemIndex,
				description:
					apiVersion > SUPPORTED_API_VERSION
						? 'Update the n8n-nodes-opencart package.'
						: 'Update the n8n API module in the OpenCart store.',
			},
		);
	}

	if (!body.success) {
		const error = body.error ?? { code: 'unknown_error', message: 'Unknown error' };

		throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
			itemIndex,
			httpCode: String(statusCode),
			message: error.message,
			description: `Error code: ${error.code}${error.details ? `. Details: ${JSON.stringify(error.details)}` : ''}`,
		});
	}

	return { data: body.data, meta: body.meta ?? {} };
}
