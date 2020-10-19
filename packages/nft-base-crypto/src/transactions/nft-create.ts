import { Transactions, Utils, Validation } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import { NFTBaseStaticFees, NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTTokenAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTCreateTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTCreate;
    public static key = "NFTCreate";
    public static version = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTCreate);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        Validation.validator.removeKeyword("tokenAttributesByteSize");
        Validation.validator.addKeyword("tokenAttributesByteSize", {
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
            $id: "NFTCreate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTCreate },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
                asset: {
                    type: "object",
                    required: ["nftToken"],
                    properties: {
                        nftToken: {
                            type: "object",
                            required: ["collectionId", "attributes"],
                            properties: {
                                collectionId: {
                                    $ref: "transactionId",
                                },
                                attributes: {
                                    type: "object",
                                    tokenAttributesByteSize: defaults.nftTokenAttributesByteSize,
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

        Asserts.assert.defined<NFTTokenAsset>(data.asset?.nftToken);
        const nftToken: NFTTokenAsset = data.asset.nftToken;

        const dataBuffer = Buffer.from(JSON.stringify(nftToken.attributes));

        const buffer: ByteBuffer = new ByteBuffer(32 + 4 + dataBuffer.length, true);

        buffer.append(nftToken.collectionId, "hex");

        buffer.writeUint32(dataBuffer.length);
        buffer.append(dataBuffer, "hex");

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const collectionId = buf.readBytes(32).toString("hex");

        const attributesLength: number = buf.readUInt32();
        const attributes = JSON.parse(buf.readString(attributesLength));

        const nftToken: NFTTokenAsset = {
            collectionId: collectionId,
            attributes: attributes,
        };

        data.asset = {
            nftToken,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
