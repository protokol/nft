import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { AllBurnsQuery, Burns as BurnsResource } from "../../resourcesTypes/base";

export class Burns extends Resource {
    public async all(query?: AllBurnsQuery): Promise<ApiResponseWithPagination<BurnsResource[]>> {
        return this.sendGet("burns", query);
    }

    public async get(id: string): Promise<ApiResponse<BurnsResource>> {
        return this.sendGet(`burns/${id}`);
    }
}
