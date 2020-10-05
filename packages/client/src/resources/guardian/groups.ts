import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { AllGroupsQuery, Group, User } from "../../resources-types/guardian";

export class Groups extends Resource {
	public async index(query?: AllGroupsQuery): Promise<ApiResponseWithPagination<Group[]>> {
		return this.sendGet("guardian/groups", query);
	}

	public async get(groupName: string): Promise<ApiResponse<Group>> {
		return this.sendGet(`guardian/groups/${groupName}`);
	}

	public async users(groupName: string): Promise<ApiResponse<User[]>> {
		return this.sendGet(`guardian/groups/${groupName}/users`);
	}
}
