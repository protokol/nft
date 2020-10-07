import { Schemas } from "@arkecosystem/core-api";
import Joi from "@hapi/joi";

export const groupCriteriaSchemaObject = {
	name: Joi.string(),
	priority: Joi.number(),
	active: Joi.boolean(),
	default: Joi.boolean(),
};

export const groupSortingSchema = Schemas.createSortingSchema(groupCriteriaSchemaObject);

export const groupCriteriaQuerySchema = Joi.object(groupCriteriaSchemaObject);
