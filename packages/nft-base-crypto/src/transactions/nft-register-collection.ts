import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import {
    NFTBaseStaticFees,
    NFTBaseTransactionGroup,
    NFTBaseTransactionTypes,
    NFTBaseTransactionVersion,
} from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { amount, stringPattern, vendorField } from "./utils/schemas";

const { schemas } = Transactions;

export class NFTRegisterCollectionTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTRegisterCollection;
    public static key = "NFTRegisterCollection";
    public static version = NFTBaseTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTRegisterCollection);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTRegisterCollection",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTRegisterCollection },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount,
                vendorField,
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
                                        stringPattern,
                                        {
                                            minLength: defaults.nftCollectionName.minLength,
                                            maxLength: defaults.nftCollectionName.maxLength,
                                        },
                                    ],
                                },
                                description: {
                                    allOf: [
                                        stringPattern,
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
                                metadata: {
                                    type: "object",
                                    tokenAttributesByteSize: defaults.nftTokenAttributesByteSize,
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
                                claimable: {
                                    type: "boolean",
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

        const metadataBuffer = nftCollectionAsset.metadata
            ? Buffer.from(JSON.stringify(nftCollectionAsset.metadata))
            : Buffer.from("");

        const buffer: ByteBuffer = new ByteBuffer(
            nameBuffer.length +
                descriptionBuffer.length +
                4 +
                jsonSchemaBuffer.length +
                3 +
                buffersAllowedIssuersPublicKeys.length * 66,
            4 + metadataBuffer.length + 1, // 1 byte for claimable
            true,
        );

        buffer.writeByte(nameBuffer.length);
        buffer.append(nameBuffer, "hex");

        buffer.writeByte(descriptionBuffer.length);
        buffer.append(descriptionBuffer, "hex");

        buffer.writeUint32(nftCollectionAsset.maximumSupply);

        buffer.writeUint32(jsonSchemaBuffer.length);
        buffer.append(jsonSchemaBuffer, "hex");

        buffer.writeByte(buffersAllowedIssuersPublicKeys.length);
        if (nftCollectionAsset.allowedIssuers) {
            for (const buf of buffersAllowedIssuersPublicKeys) {
                buffer.append(buf, "hex");
            }
        }

        buffer.writeUint32(metadataBuffer.length);
        if (nftCollectionAsset.metadata) {
            buffer.append(metadataBuffer, "hex");
        }

        buffer.writeByte(nftCollectionAsset.claimable ? 1 : 0);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);

        const descriptionLength: number = buf.readUint8();
        const description: string = buf.readString(descriptionLength);

        const maximumSupply = buf.readUint32();

        const schemaLength: number = buf.readUInt32();
        const jsonSchema = JSON.parse(buf.readString(schemaLength));

        const nftCollection: NFTCollectionAsset = {
            name,
            description,
            maximumSupply,
            jsonSchema,
        };
        const numberOfSchemaIssuers = buf.readUint8();
        if (numberOfSchemaIssuers !== 0) {
            const allowedSchemaIssuers: string[] = [];
            for (let i = 0; i < numberOfSchemaIssuers; i++) {
                allowedSchemaIssuers.push(buf.readString(66));
            }
            nftCollection.allowedIssuers = allowedSchemaIssuers;
        }

        const metadataLength = buf.readUint32();
        if (metadataLength) {
            nftCollection.metadata = JSON.parse(buf.readString(metadataLength));
        }

        const claimable = Boolean(buf.readUint8());
        if (claimable) {
            nftCollection.claimable = claimable;
        }

        data.asset = {
            nftCollection,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
