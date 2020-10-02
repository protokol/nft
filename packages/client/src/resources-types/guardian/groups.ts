import { ApiQuery } from "@arkecosystem/client";

export interface Group {
	name: string;
	priority: number;
	active: boolean;
	default: boolean;
	permissions: Permissions[];
}

export interface Permissions {
	kind: number;
	types: Types[];
}

export interface Types {
	transactionType: number;
	transactionTypeGroup: number;
}

export interface AllGroupsQuery extends ApiQuery {
	orderBy?: string;
}
