import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { AllBurnsQuery, Burns as BurnsResource } from "../../resources-types/base";

export class Burns extends Resource {
    public async all(query?: AllBurnsQuery): Promise<ApiResponseWithPagination<BurnsResource[]>> {
        return this.sendGet("nft/burns", query);
    }

    public async get(id: string): Promise<ApiResponse<BurnsResource>> {
        return this.sendGet(`nft/burns/${id}`);
    }
}
