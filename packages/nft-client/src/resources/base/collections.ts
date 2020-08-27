import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
	AllCollectionsQuery,
	Collections as CollectionsResource,
	CollectionsAsset,
	CollectionsWallet,
	Schema,
	SearchCollectionsApiBody,
} from "../../resourcesTypes/base/collections";

export class Collections extends Resource {
	public async all(query?: AllCollectionsQuery): Promise<ApiResponseWithPagination<CollectionsResource[]>> {
		return this.sendGet("nft/collections", query);
	}

	public async get(id: string): Promise<ApiResponse<CollectionsResource>> {
		return this.sendGet(`nft/collections/${id}`);
	}

	public async getSchema(id: string): Promise<ApiResponse<Schema>> {
		return this.sendGet(`nft/collections/${id}/schema`);
	}

	public async wallet(id: string): Promise<ApiResponse<CollectionsWallet>> {
		return this.sendGet(`nft/collections/${id}/wallets`);
	}

	public async searchByCollections(
		payload: SearchCollectionsApiBody,
		query?: AllCollectionsQuery,
	): Promise<ApiResponseWithPagination<CollectionsResource[]>> {
		return this.sendPost("nft/collections/search", payload, query);
	}

	public async assetByCollectionId(
		id: string,
		query?: AllCollectionsQuery,
	): Promise<ApiResponseWithPagination<CollectionsAsset[]>> {
		return this.sendGet(`nft/collections/${id}/assets`, query);
	}
}
