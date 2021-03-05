import { Identities, Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import {
    NFTBaseStaticFees,
    NFTBaseTransactionGroup,
    NFTBaseTransactionTypes,
    NFTBaseTransactionVersion,
} from "../enums";
import { NFTTokenAsset } from "../interfaces";
import { amount, vendorField } from "./utils/schemas";

const { schemas } = Transactions;

export class NFTCreateTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTCreate;
    public static key = "NFTCreate";
    public static version = NFTBaseTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTCreate);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTCreate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTCreate },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount,
                vendorField,
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
                                recipientId: {
                                    $ref: "address",
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

        const recipientLength = nftToken.recipientId?.length || 0;

        const buffer: ByteBuffer = new ByteBuffer(32 + 4 + dataBuffer.length + 1 + recipientLength, true);

        buffer.append(nftToken.collectionId, "hex");

        buffer.writeUint32(dataBuffer.length);
        buffer.append(dataBuffer, "hex");

        buffer.writeByte(recipientLength);
        if (recipientLength) {
            const { addressBuffer } = Identities.Address.toBuffer(nftToken.recipientId!);
            buffer.append(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const collectionId = buf.readBytes(32).toString("hex");

        const attributesLength: number = buf.readUInt32();
        const attributes = JSON.parse(buf.readString(attributesLength));

        const nftToken: NFTTokenAsset = {
            collectionId,
            attributes,
        };

        const recipientLength = buf.readUint8();
        if (recipientLength) {
            nftToken.recipientId = Identities.Address.fromBuffer(buf.readBytes(21).toBuffer());
        }

        data.asset = {
            nftToken,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
