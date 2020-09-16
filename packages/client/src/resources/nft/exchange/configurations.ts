import { ApiResponse, Resource } from "@arkecosystem/client";

import { ExchangeConfigurations as ConfigurationsResource } from "../../../resources-types/nft/exchange";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<ConfigurationsResource>> {
        return this.sendGet("nft/exchange/configurations");
    }
}
