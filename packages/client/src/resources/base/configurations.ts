import { ApiResponse, Resource } from "@arkecosystem/client";

import { BaseConfigurations as ConfigurationsResource } from "../../resources-types/base";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<ConfigurationsResource>> {
        return this.sendGet("nft/configurations");
    }
}
