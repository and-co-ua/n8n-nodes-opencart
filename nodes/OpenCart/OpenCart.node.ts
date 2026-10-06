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
	attributeFields,
	attributeGroupFields,
	attributeGroupOperations,
	attributeOperations,
	buildAttributeGroupRequest,
	buildAttributeRequest,
} from './descriptions/AttributeDescription';
import {
	buildCategoryRequest,
	categoryFields,
	categoryOperations,
} from './descriptions/CategoryDescription';
import type { ApiCall } from './descriptions/common';
import { buildCouponRequest, couponFields, couponOperations } from './descriptions/CouponDescription';
import {
	buildCustomerApprovalRequest,
	customerApprovalFields,
	customerApprovalOperations,
} from './descriptions/CustomerApprovalDescription';
import { buildCustomerRequest, customerFields, customerOperations } from './descriptions/CustomerDescription';
import {
	buildCustomerGroupRequest,
	customerGroupFields,
	customerGroupOperations,
} from './descriptions/CustomerGroupDescription';
import {
	buildDownloadRequest,
	downloadFields,
	downloadOperations,
} from './descriptions/DownloadDescription';
import {
	buildFilterGroupRequest,
	filterGroupFields,
	filterGroupOperations,
} from './descriptions/FilterGroupDescription';
import {
	buildInformationRequest,
	informationFields,
	informationOperations,
} from './descriptions/InformationDescription';
import { buildImageRequest, imageFields, imageOperations } from './descriptions/ImageDescription';
import { buildLogRequest, logFields, logOperations } from './descriptions/LogDescription';
import { buildLookupRequest, lookupFields, lookupOperations } from './descriptions/LookupDescription';
import { buildMailRequest, mailFields, mailOperations } from './descriptions/MailDescription';
import {
	buildMaintenanceRequest,
	maintenanceFields,
	maintenanceOperations,
} from './descriptions/MaintenanceDescription';
import {
	buildManufacturerRequest,
	manufacturerFields,
	manufacturerOperations,
} from './descriptions/ManufacturerDescription';
import { buildOrderRequest, orderFields, orderOperations } from './descriptions/OrderDescription';
import {
	buildMarketingRequest,
	marketingFields,
	marketingOperations,
} from './descriptions/MarketingDescription';
import { buildOptionRequest, optionFields, optionOperations } from './descriptions/OptionDescription';
import {
	buildProductRequest,
	bulkItem,
	productFields,
	productOperations,
} from './descriptions/ProductDescription';
import { buildReturnRequest, returnFields, returnOperations } from './descriptions/ReturnDescription';
import { buildReviewRequest, reviewFields, reviewOperations } from './descriptions/ReviewDescription';
import { buildSystemRequest, systemFields, systemOperations } from './descriptions/SystemDescription';
import { buildVoucherRequest, voucherFields, voucherOperations } from './descriptions/VoucherDescription';
import { openCartApiRequest, openCartApiRequestAllItems, openCartApiRequestBatches } from './GenericFunctions';
import { listSearch, loadOptions } from './LoadOptions';

/** Resource → builder of the API call (action + params) for one item. See docs/API.md of the module. */
const BUILDERS: Record<
	string,
	(this: IExecuteFunctions, operation: string, i: number) => ApiCall | Promise<ApiCall>
> = {
	attribute: buildAttributeRequest,
	attribute_group: buildAttributeGroupRequest,
	category: buildCategoryRequest,
	coupon: buildCouponRequest,
	customer: buildCustomerRequest,
	customer_approval: buildCustomerApprovalRequest,
	customer_group: buildCustomerGroupRequest,
	download: buildDownloadRequest,
	filter_group: buildFilterGroupRequest,
	image: buildImageRequest,
	information: buildInformationRequest,
	log: buildLogRequest,
	lookup: buildLookupRequest,
	mail: buildMailRequest,
	maintenance: buildMaintenanceRequest,
	manufacturer: buildManufacturerRequest,
	marketing: buildMarketingRequest,
	option: buildOptionRequest,
	order: buildOrderRequest,
	product: buildProductRequest,
	return: buildReturnRequest,
	review: buildReviewRequest,
	system: buildSystemRequest,
	voucher: buildVoucherRequest,
};

/**
 * Product → Bulk Update: every input item is one product. Items are sent in batches of 500
 * (product.bulk_update) and each input item gets its own result item.
 */
async function executeBulkUpdate(this: IExecuteFunctions, count: number): Promise<INodeExecutionData[]> {
	const batchSize = 500;
	const output: INodeExecutionData[] = [];

	for (let start = 0; start < count; start += batchSize) {
		const end = Math.min(start + batchSize, count);
		const payload: IDataObject[] = [];

		try {
			for (let i = start; i < end; i++) {
				payload.push(bulkItem.call(this, i));
			}

			const { data } = await openCartApiRequest.call(this, 'product', 'bulk_update', { items: payload }, start);

			for (const result of (data as IDataObject).results as IDataObject[]) {
				const i = start + (result.index as number);
				const { index, ...rest } = result;

				output.push({ json: { ...payload[index as number], ...rest }, pairedItem: { item: i } });
			}
		} catch (error) {
			if (!this.continueOnFail()) {
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: start });
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: start });
			}

			for (let i = start; i < end; i++) {
				output.push({ json: { error: (error as JsonObject).message as string }, pairedItem: { item: i } });
			}
		}
	}

	return output;
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
						name: 'Attribute',
						value: 'attribute',
					},
					{
						name: 'Attribute Group',
						value: 'attribute_group',
					},
					{
						name: 'Category',
						value: 'category',
					},
					{
						name: 'Coupon',
						value: 'coupon',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Customer Approval',
						value: 'customer_approval',
					},
					{
						name: 'Customer Group',
						value: 'customer_group',
					},
					{
						name: 'Download',
						value: 'download',
					},
					{
						name: 'Filter Group',
						value: 'filter_group',
					},
					{
						name: 'Gift Voucher',
						value: 'voucher',
					},
					{
						name: 'Image',
						value: 'image',
						description: 'URLs of resized store images',
					},
					{
						name: 'Information Page',
						value: 'information',
					},
					{
						name: 'Log',
						value: 'log',
						description: 'Error and OCMOD logs',
					},
					{
						name: 'Lookup',
						value: 'lookup',
						description: 'Reference lists: languages, statuses, countries and more',
					},
					{
						name: 'Mail',
						value: 'mail',
						description: 'Mailing to customers, as Marketing → Mail in the admin panel',
					},
					{
						name: 'Maintenance',
						value: 'maintenance',
						description: 'Cleanup of sessions and caches',
					},
					{
						name: 'Manufacturer',
						value: 'manufacturer',
					},
					{
						name: 'Marketing Campaign',
						value: 'marketing',
					},
					{
						name: 'Option',
						value: 'option',
					},
					{
						name: 'Order',
						value: 'order',
					},
					{
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Return',
						value: 'return',
					},
					{
						name: 'Review',
						value: 'review',
					},
					{
						name: 'System',
						value: 'system',
					},
				],
				default: 'category',
			},
			...attributeOperations,
			...attributeFields,
			...attributeGroupOperations,
			...attributeGroupFields,
			...categoryOperations,
			...categoryFields,
			...couponOperations,
			...couponFields,
			...customerOperations,
			...customerFields,
			...customerApprovalOperations,
			...customerApprovalFields,
			...customerGroupOperations,
			...customerGroupFields,
			...downloadOperations,
			...downloadFields,
			...filterGroupOperations,
			...filterGroupFields,
			...imageOperations,
			...imageFields,
			...informationOperations,
			...informationFields,
			...logOperations,
			...logFields,
			...lookupOperations,
			...lookupFields,
			...mailOperations,
			...mailFields,
			...maintenanceOperations,
			...maintenanceFields,
			...manufacturerOperations,
			...manufacturerFields,
			...marketingOperations,
			...marketingFields,
			...optionOperations,
			...optionFields,
			...orderOperations,
			...orderFields,
			...productOperations,
			...productFields,
			...returnOperations,
			...returnFields,
			...reviewOperations,
			...reviewFields,
			...systemOperations,
			...systemFields,
			...voucherOperations,
			...voucherFields,
		],
	};

	methods = {
		loadOptions,
		listSearch,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		if (
			items.length > 0 &&
			this.getNodeParameter('resource', 0) === 'product' &&
			this.getNodeParameter('operation', 0) === 'bulkUpdate'
		) {
			return [await executeBulkUpdate.call(this, items.length)];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const call = await BUILDERS[resource].call(this, operation, i);

				let data: unknown;

				if (call.batched) {
					data = await openCartApiRequestBatches.call(this, resource, call.action, call.params, i);
				} else if (call.list && this.getNodeParameter('returnAll', i, false)) {
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
