import { ApiQuery } from "@arkecosystem/client";

export interface Group {
	name: string;
	priority: number;
	active: boolean;
	default: boolean;
	allow: Permission[];
	deny: Permission[];
}

export interface Permission {
	transactionType: number;
	transactionTypeGroup: number;
}

export interface AllGroupsQuery extends ApiQuery {
	orderBy?: string;
	name?: string;
	priority?: number;
	active?: boolean;
	default?: boolean;
}
