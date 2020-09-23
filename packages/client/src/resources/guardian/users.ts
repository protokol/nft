import { ApiQuery, ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { User, UserGroups } from "../../resources-types/guardian";

export class Users extends Resource {
    public async index(query?: ApiQuery): Promise<ApiResponseWithPagination<User>> {
        return this.sendGet("guardian/users");
    }

    public async get(publicKey: string): Promise<ApiResponse<User>> {
        return this.sendGet(`guardian/users/${publicKey}`);
    }

    public async userGroups(publicKey: string): Promise<ApiResponse<UserGroups>> {
        return this.sendGet(`guardian/users/${publicKey}/groups`);
    }
}
