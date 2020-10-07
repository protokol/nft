import { Contracts } from "@arkecosystem/core-kernel";
import Joi from "@hapi/joi";
import { Interfaces } from "@protokol/guardian-transactions";

export type UserResource = Interfaces.IUserPermissions & {
	publicKey: string;
};

export type UserCriteria = Contracts.Search.StandardCriteriaOf<UserResource>;

export const userCriteriaSchemaObject = {
	publicKey: Joi.string(),
};

export const userCriteriaQuerySchema = Joi.object(userCriteriaSchemaObject);
