import { Transactions, Utils, Validation } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { NFTBaseStaticFees, NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTCollectionAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTRegisterCollectionTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTRegisterCollection;
    public static key = "NFTRegisterCollection";
    public static version = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTRegisterCollection);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        Validation.validator.removeKeyword("collectionJsonSchemaByteSize");
        Validation.validator.addKeyword("collectionJsonSchemaByteSize", {
            compile(schema, parentSchema) {
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
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTRegisterCollection",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTRegisterCollection },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
                asset: {
                    type: "object",
                    required: ["nftCollection"],
                    properties: {
                        nftCollection: {
                            type: "object",
                            required: ["name", "description", "maximumSupply", "jsonSchema"],
                            properties: {
                                name: {
                                    allOf: [
                                        { type: "string", pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$" },
                                        {
                                            minLength: defaults.nftCollectionName.minLength,
                                            maxLength: defaults.nftCollectionName.maxLength,
                                        },
                                    ],
                                },
                                description: {
                                    allOf: [
                                        { type: "string", pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$" },
                                        {
                                            minLength: defaults.nftCollectionDescription.minLength,
                                            maxLength: defaults.nftCollectionDescription.maxLength,
                                        },
                                    ],
                                },
                                maximumSupply: {
                                    type: "integer",
                                    minimum: 1,
                                },
                                jsonSchema: {
                                    type: "object",
                                    collectionJsonSchemaByteSize: defaults.nftCollectionJsonSchemaByteSize,
                                },
                                allowedIssuers: {
                                    type: "array",
                                    minItems: defaults.nftCollectionAllowedIssuers.minItems,
                                    maxItems: defaults.nftCollectionAllowedIssuers.maxItems,
                                    uniqueItems: true,
                                    items: {
                                        $ref: "publicKey",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<NFTCollectionAsset>(data.asset?.nftCollection);
        const nftCollectionAsset: NFTCollectionAsset = data.asset.nftCollection;

        const nameBuffer: Buffer = Buffer.from(nftCollectionAsset.name, "utf8");
        const descriptionBuffer: Buffer = Buffer.from(nftCollectionAsset.description, "utf8");

        const jsonSchemaBuffer: Buffer = Buffer.from(JSON.stringify(nftCollectionAsset.jsonSchema), "utf8");

        const buffersAllowedIssuersPublicKeys: Buffer[] = [];
        if (nftCollectionAsset.allowedIssuers) {
            for (const publicKey of nftCollectionAsset.allowedIssuers) {
                buffersAllowedIssuersPublicKeys.push(Buffer.from(publicKey, "utf8"));
            }
        }

        const buffer: ByteBuffer = new ByteBuffer(
            nameBuffer.length +
                descriptionBuffer.length +
                4 +
                jsonSchemaBuffer.length +
                3 +
                buffersAllowedIssuersPublicKeys.length * 66,
            true,
        );

        buffer.writeByte(nameBuffer.length);
        buffer.append(nameBuffer, "hex");

        buffer.writeByte(descriptionBuffer.length);
        buffer.append(descriptionBuffer, "hex");

        buffer.writeUint32(nftCollectionAsset.maximumSupply);

        buffer.writeUint32(jsonSchemaBuffer.length);
        buffer.append(jsonSchemaBuffer, "hex");

        if (nftCollectionAsset.allowedIssuers) {
            buffer.writeByte(buffersAllowedIssuersPublicKeys.length);
            for (const buf of buffersAllowedIssuersPublicKeys) {
                buffer.append(buf, "hex");
            }
        } else {
            buffer.writeByte(0);
        }

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);

        const descriptionLength: number = buf.readUint8();
        const description: string = buf.readString(descriptionLength);

        const maximumSupply = buf.readUint32();

        const schemaLength: number = buf.readUInt32();
        const jsonSchema = JSON.parse(buf.readString(schemaLength));

        const nftCollection: NFTCollectionAsset = {
            name: name,
            description: description,
            maximumSupply: maximumSupply,
            jsonSchema: jsonSchema,
        };
        const numberOfSchemaIssuers = buf.readUint8();
        if (numberOfSchemaIssuers !== 0) {
            const allowedSchemaIssuers: string[] = [];
            for (let i = 0; i < numberOfSchemaIssuers; i++) {
                allowedSchemaIssuers.push(buf.readString(66));
            }
            nftCollection.allowedIssuers = allowedSchemaIssuers;
        }
        data.asset = {
            nftCollection,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
