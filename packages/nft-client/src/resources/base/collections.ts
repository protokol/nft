import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllCollectionsQuery,
    Collections as CollectionsResource, CollectionsAsset,
    CollectionsWallet,
    Schema,
    SearchCollectionsApiBody,
} from "../../resourcesTypes/base/collections";

export class Collections extends Resource {
    public async all(query?: AllCollectionsQuery): Promise<ApiResponseWithPagination<CollectionsResource[]>> {
        return this.sendGet("collections", query);
    }

    public async get(id: string): Promise<ApiResponse<CollectionsResource>> {
        return this.sendGet(`collections/${id}`);
    }

    public async getSchema(id: string): Promise<ApiResponse<Schema>> {
        return this.sendGet(`collections/${id}/schema`);
    }

    public async wallet(id: string): Promise<ApiResponse<CollectionsWallet>> {
        return this.sendGet(`collections/${id}/wallets`);
    }

    public async searchByCollections(
        payload: SearchCollectionsApiBody,
        query?: AllCollectionsQuery,
    ): Promise<ApiResponseWithPagination<CollectionsResource[]>> {
        return this.sendPost("collections/search", payload, query);
    }

    public async assetByCollectionId(
        id: string,
        query?: AllCollectionsQuery,
    ): Promise<ApiResponseWithPagination<CollectionsAsset[]>> {
        return this.sendGet(`collections/${id}/assets`, query);
    }
}
