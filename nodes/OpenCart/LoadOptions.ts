import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchResult,
	INodePropertyOptions,
} from 'n8n-workflow';

import { openCartApiRequest, openCartApiRequestAllItems } from './GenericFunctions';

/** Turns a lookup.* list into drop-down options. Disabled records are marked in the label. */
async function lookupOptions(
	this: ILoadOptionsFunctions,
	action: string,
	idField: string,
	label: (row: IDataObject) => string,
	params: IDataObject = {},
): Promise<INodePropertyOptions[]> {
	const { data } = await openCartApiRequest.call(this, 'lookup', action, params);

	return (data as IDataObject[]).map((row) => ({
		name: row.status === false ? `${label(row)} (disabled)` : label(row),
		value: row[idField] as number,
	}));
}

const byName = (row: IDataObject) => String(row.name);

export const loadOptions = {
	async getLanguages(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'languages', 'language_id', (row) => `${row.name} (${row.code})`);
	},

	async getStores(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'stores', 'store_id', byName);
	},

	async getCurrencies(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'currencies', 'currency_id', (row) => `${row.title} (${row.code})`);
	},

	async getOrderStatuses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'order_statuses', 'order_status_id', byName);
	},

	async getReturnStatuses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'return_statuses', 'return_status_id', byName);
	},

	async getReturnReasons(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'return_reasons', 'return_reason_id', byName);
	},

	async getReturnActions(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'return_actions', 'return_action_id', byName);
	},

	async getCustomerGroups(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'customer_groups', 'customer_group_id', byName);
	},

	async getCountries(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'countries', 'country_id', byName);
	},

	/** Zones of the country selected in the `countryId` parameter; empty until a country is chosen. */
	async getZones(this: ILoadOptionsFunctions) {
		const countryId = this.getCurrentNodeParameter('countryId');

		if (!countryId) {
			return [];
		}

		return lookupOptions.call(this, 'zones', 'zone_id', byName, { country_id: countryId as number });
	},

	async getStockStatuses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'stock_statuses', 'stock_status_id', byName);
	},

	async getLengthClasses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'length_classes', 'length_class_id', (row) => `${row.title} (${row.unit})`);
	},

	async getWeightClasses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'weight_classes', 'weight_class_id', (row) => `${row.title} (${row.unit})`);
	},

	async getTaxClasses(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'tax_classes', 'tax_class_id', (row) => String(row.title));
	},

	async getVoucherThemes(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'voucher_themes', 'voucher_theme_id', byName);
	},

	/** All categories by path ("Desktops > Mac"). */
	async getCategories(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'category', 'list', { sort: 'name' });

		return rows.map((row) => ({
			name: row.status === false ? `${row.path} (disabled)` : String(row.path),
			value: row.category_id as number,
		}));
	},

	/** Categories with "(Top Level)" = 0 first, for parent selection. */
	async getParentCategories(this: ILoadOptionsFunctions) {
		return [{ name: '(Top Level)', value: 0 }, ...(await loadOptions.getCategories.call(this))];
	},

	async getAttributeGroups(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'attribute_group', 'list', { sort: 'name' });

		return rows.map((row) => ({ name: String(row.name), value: row.attribute_group_id as number }));
	},

	/** Attributes as "Group / Name". */
	async getAttributes(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'attribute', 'list', {});

		return rows.map((row) => ({
			name: `${row.attribute_group} / ${row.name}`,
			value: row.attribute_id as number,
		}));
	},

	async getManufacturers(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'manufacturer', 'list', { sort: 'name' });

		return rows.map((row) => ({ name: String(row.name), value: row.manufacturer_id as number }));
	},

	async getOptions(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'option', 'list', { sort: 'name' });

		return rows.map((row) => ({ name: `${row.name} (${row.type})`, value: row.option_id as number }));
	},

	async getDownloads(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'download', 'list', { sort: 'name' });

		return rows.map((row) => ({ name: `${row.name} (${row.mask})`, value: row.download_id as number }));
	},

	async getFilterGroups(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'filter_group', 'list', { sort: 'name' });

		return rows.map((row) => ({ name: String(row.name), value: row.filter_group_id as number }));
	},

	/** Filters of all groups as "Group > Filter". */
	async getFilters(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'filter_group', 'list', { sort: 'name' });

		return rows.flatMap((group) =>
			(group.filters as IDataObject[]).map((filter) => ({
				name: `${group.name} > ${filter.name}`,
				value: filter.filter_id as number,
			})),
		);
	},

	async getInformationPages(this: ILoadOptionsFunctions) {
		const rows = await openCartApiRequestAllItems.call(this, 'information', 'list', { sort: 'title' });

		return rows.map((row) => ({
			name: row.status === false ? `${row.title} (disabled)` : String(row.title),
			value: row.information_id as number,
		}));
	},

	async getLayouts(this: ILoadOptionsFunctions) {
		return lookupOptions.call(this, 'layouts', 'layout_id', byName);
	},
};

export const listSearch = {
	/** Products by name, model or SKU, 50 per page, for the product resource locator. */
	async searchProducts(
		this: ILoadOptionsFunctions,
		filter?: string,
		paginationToken?: string,
	): Promise<INodeListSearchResult> {
		const start = paginationToken ? Number(paginationToken) : 0;
		const limit = 50;
		const { data, meta } = await openCartApiRequest.call(this, 'product', 'list', {
			filter_search: filter ?? '',
			sort: 'name',
			start,
			limit,
		});

		return {
			results: (data as IDataObject[]).map((row) => ({
				name: `${row.name} (${row.model})${row.status === false ? ' (disabled)' : ''}`,
				value: String(row.product_id),
			})),
			paginationToken: start + limit < Number(meta.total ?? 0) ? String(start + limit) : undefined,
		};
	},
};
