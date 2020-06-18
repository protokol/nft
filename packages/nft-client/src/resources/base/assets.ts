import { ApiQuery, ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllAssetsQuery,
    Assets as AssetsResource,
    AssetsWallet,
    SearchAssetApiBody,
} from "../../resourcesTypes/base/assets";

export class Assets extends Resource {
    public async all(query?: AllAssetsQuery): Promise<ApiResponseWithPagination<AssetsResource[]>> {
        return this.sendGet("assets", query);
    }

    public async get(id: string): Promise<ApiResponse<AssetsResource>> {
        return this.sendGet(`assets/${id}`);
    }

    public async wallet(id: string): Promise<ApiResponse<AssetsWallet>> {
        return this.sendGet(`assets/${id}/wallets`);
    }

    public async searchByAsset(
        payload: SearchAssetApiBody,
        query?: ApiQuery,
    ): Promise<ApiResponseWithPagination<AssetsResource[]>> {
        return this.sendPost("assets/search", payload, query);
    }
}
