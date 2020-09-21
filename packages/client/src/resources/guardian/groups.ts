import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { Group, User } from "../../resources-types/guardian";

export class Groups extends Resource {
    public async index(): Promise<ApiResponseWithPagination<Group>> {
        return this.sendGet("guardian/groups");
    }

    public async get(groupName: string): Promise<ApiResponse<Group>> {
        return this.sendGet(`guardian/groups/${groupName}`);
    }

    public async users(groupName: string): Promise<ApiResponse<User>> {
        return this.sendGet(`guardian/groups/${groupName}/users`);
    }
}
