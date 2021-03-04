import { Validation } from "@arkecosystem/crypto";

export const amount = { bignumber: { minimum: 0, maximum: 0 } };
export const vendorField = { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] };
export const stringPattern = { type: "string", pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$" };

const addByteSizeValidator = (keyword: string): void => {
    Validation.validator.removeKeyword(keyword);
    Validation.validator.addKeyword(keyword, {
        compile(schema) {
            return (data) => {
                return Buffer.from(JSON.stringify(data), "utf8").byteLength <= schema;
            };
        },
        errors: true,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};

addByteSizeValidator("collectionJsonSchemaByteSize");
addByteSizeValidator("tokenAttributesByteSize");
