import { ApiQuery } from "@arkecosystem/client";

import { Permission } from "./groups";

export interface User {
	publicKey: string;
	groups: string[];
	allow: Permission[];
	deny: Permission[];
}

export interface AllUsersQuery extends ApiQuery {
	publicKey?: string;
}
