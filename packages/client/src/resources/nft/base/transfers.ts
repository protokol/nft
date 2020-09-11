import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { Transfers as TransfersResource } from "../../../resources-types/nft/base";
import { AllTransfersQuery } from "../../../resources-types/nft/base";

export class Transfers extends Resource {
    public async all(query?: AllTransfersQuery): Promise<ApiResponseWithPagination<TransfersResource[]>> {
        return this.sendGet("nft/transfers");
    }

    public async get(id: string): Promise<ApiResponse<TransfersResource>> {
        return this.sendGet(`nft/transfers/${id}`);
    }
}
