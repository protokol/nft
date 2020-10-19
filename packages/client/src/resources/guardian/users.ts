import { ApiResponse, ApiResponseWithPagination, Resource } from "@arkecosystem/client";

import { AllUsersQuery, Group, User } from "../../resources-types/guardian";

export class Users extends Resource {
	public async index(query?: AllUsersQuery): Promise<ApiResponseWithPagination<User[]>> {
		return this.sendGet("guardian/users", query);
	}

	public async get(publicKey: string): Promise<ApiResponse<User>> {
		return this.sendGet(`guardian/users/${publicKey}`);
	}

	public async userGroups(publicKey: string): Promise<ApiResponse<Group[]>> {
		return this.sendGet(`guardian/users/${publicKey}/groups`);
	}
}
