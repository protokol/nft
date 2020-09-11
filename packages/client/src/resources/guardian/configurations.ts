import { ApiResponse, Resource } from "@arkecosystem/client";
import { GuardianConfigurations } from "../../resources-types/guardian";

export class Configurations extends Resource {
    public async index(): Promise<ApiResponse<GuardianConfigurations>> {
        return this.sendGet("guardian/configurations");
    }
}
