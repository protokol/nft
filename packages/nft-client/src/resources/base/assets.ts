import { ApiQuery, ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import {
    AllAssetsQuery,
    Assets as AssetsResource,
    AssetsTimestamp,
    AssetsWallet,
    SearchAssetApiBody,
} from "../../resourcesTypes/base/assets";

export class Assets extends Resource {
    public async all(query?: AllAssetsQuery): Promise<ApiResponseWithPagination<AssetsTimestamp[]>> {
        return this.sendGet("nft/assets", query);
    }

    public async get(id: string): Promise<ApiResponse<AssetsResource>> {
        return this.sendGet(`nft/assets/${id}`);
    }

    public async wallet(id: string): Promise<ApiResponse<AssetsWallet>> {
        return this.sendGet(`nft/assets/${id}/wallets`);
    }

    public async searchByAsset(
        payload: SearchAssetApiBody,
        query?: ApiQuery,
    ): Promise<ApiResponseWithPagination<AssetsTimestamp[]>> {
        return this.sendPost("nft/assets/search", payload, query);
    }
}
