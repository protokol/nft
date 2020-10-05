import { defaults } from "../../defaults";

export const amountSchema = { bignumber: { minimum: 0, maximum: 0 } };

export const vendorFieldSchema = { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] };

export const groupNameSchema = {
    type: "string",
    minLength: defaults.guardianGroupName.minLength,
    maxLength: defaults.guardianGroupName.maxLength,
};

export const permissionsSchema = {
    type: "array",
    uniqueItems: true,
    items: {
        type: "object",
        required: ["transactionType", "transactionTypeGroup"],
        properties: {
            transactionType: { type: "integer", minimum: 0 },
            transactionTypeGroup: { type: "integer", minimum: 0 },
        },
    },
};
