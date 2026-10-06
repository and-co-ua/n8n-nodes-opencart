import type { ICredentialDataDecryptedObject, IDataObject, IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Requests to the API built into OpenCart 3 (catalog/controller/api/*): log in with the API user
 * (api/login → api_token), then POST form data to index.php?route=api/...&api_token=...
 * The token is the id of a session that keeps the cart, customer, addresses and methods.
 */
export interface StandardSession {
	url: string;
	token: string;
	storeId?: number;
}

function storeUrl(credentials: ICredentialDataDecryptedObject): string {
	return (credentials.url as string).trim().replace(/\/+$/, '');
}

/** Encodes data the way PHP reads $_POST: product[0][option][218]=5 */
export function toForm(data: IDataObject): string {
	const parts: string[] = [];

	const add = (key: string, value: unknown) => {
		if (value === undefined || value === null) {
			return;
		}

		if (Array.isArray(value)) {
			value.forEach((item, index) => add(`${key}[${index}]`, item));
		} else if (typeof value === 'object') {
			for (const [name, item] of Object.entries(value as IDataObject)) {
				add(`${key}[${name}]`, item);
			}
		} else {
			const text = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
			parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(text)}`);
		}
	};

	for (const [name, value] of Object.entries(data)) {
		add(name, value);
	}

	return parts.join('&');
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&lt;': '<', '&gt;': '>' };

/** OpenCart returns errors as a string or as field → message (sometimes nested); one line of text. */
export function errorText(error: unknown): string {
	if (typeof error === 'string') {
		// Language strings may hold HTML entities (e.g. "Date &amp; Time required!")
		return error.replace(/&(amp|quot|#039|lt|gt);/g, (entity) => ENTITIES[entity]);
	}

	if (Array.isArray(error)) {
		return error.map(errorText).join(' ');
	}

	if (error && typeof error === 'object') {
		return Object.values(error as IDataObject)
			.map(errorText)
			.filter((text) => text !== '')
			.join('; ');
	}

	return '';
}

function parse(body: unknown): IDataObject | undefined {
	if (typeof body === 'string') {
		try {
			body = JSON.parse(body);
		} catch {
			return undefined;
		}
	}

	// An empty PHP array is encoded as [] (e.g. api/login with a wrong key)
	if (Array.isArray(body)) {
		return {};
	}

	return typeof body === 'object' && body !== null ? (body as IDataObject) : undefined;
}

/** Why api/login failed, or undefined when it returned a token. */
function loginError(body: IDataObject | undefined): string | undefined {
	if (body === undefined) {
		return 'The store did not return a JSON response. Check the Store URL.';
	}

	if (typeof body.api_token === 'string' && body.api_token !== '') {
		return undefined;
	}

	const error = body.error as IDataObject | undefined;

	// Not allowed IP: OpenCart adds a generic key error too, the IP message is the useful one
	if (error?.ip) {
		return `${errorText(error.ip)} Add it in System → Users → API → IP Addresses.`;
	}

	return error ? errorText(error) : 'Wrong API username or key.';
}

export async function standardLogin(
	this: IExecuteFunctions,
	itemIndex: number,
	storeId?: number,
): Promise<StandardSession> {
	const credentials = await this.getCredentials('openCartStandardApi');
	const url = storeUrl(credentials);
	let body: unknown;

	try {
		body = await this.helpers.httpRequestWithAuthentication.call(this, 'openCartStandardApi', {
			method: 'POST',
			url: `${url}/index.php`,
			qs: { route: 'api/login' },
			body: toForm({ username: credentials.username as string, key: credentials.apiKey as string }),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}

	const data = parse(body);
	const message = loginError(data);

	if (message !== undefined) {
		throw new NodeApiError(this.getNode(), (data ?? {}) as JsonObject, {
			itemIndex,
			message: `OpenCart API login failed: ${message}`,
		});
	}

	return { url, token: (data as IDataObject).api_token as string, storeId };
}

/**
 * Calls one route of the standard API. A response with `error` fails with its message, prefixed
 * by `step` (unless `allowErrors`, for warnings like stock in api/cart/products).
 */
export async function standardRequest(
	this: IExecuteFunctions,
	session: StandardSession,
	route: string,
	step: string,
	itemIndex: number,
	form: IDataObject = {},
	qs: IDataObject = {},
	allowErrors = false,
): Promise<IDataObject> {
	const query: IDataObject = { route, api_token: session.token, ...qs };

	if (session.storeId !== undefined) {
		query.store_id = session.storeId;
	}

	let body: unknown;

	try {
		body = await this.helpers.httpRequestWithAuthentication.call(this, 'openCartStandardApi', {
			method: 'POST',
			url: `${session.url}/index.php`,
			qs: query,
			body: toForm(form),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}

	const data = parse(body);

	if (data === undefined) {
		throw new NodeApiError(this.getNode(), { body: String(body).slice(0, 500) } as JsonObject, {
			itemIndex,
			message: `The store did not return a JSON response for ${route}`,
			description: 'Check the Store URL and the store error log.',
		});
	}

	if (data.error !== undefined && !allowErrors) {
		throw new NodeApiError(this.getNode(), data as JsonObject, {
			itemIndex,
			message: `${step}: ${errorText(data.error)}`,
		});
	}

	return data;
}
