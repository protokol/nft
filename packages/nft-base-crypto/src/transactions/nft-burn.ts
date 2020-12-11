import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { NFTBaseStaticFees, NFTBaseTransactionGroup, NFTBaseTransactionTypes } from "../enums";
import { NFTBurnAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTBurnTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTBurn;
    public static key = "NFTBurn";
    public static version = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTBurn);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTBurn",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTBurn },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
                asset: {
                    type: "object",
                    required: ["nftBurn"],
                    properties: {
                        nftBurn: {
                            type: "object",
                            required: ["nftId"],
                            properties: {
                                nftId: {
                                    $ref: "transactionId",
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

        Asserts.assert.defined<NFTBurnAsset>(data.asset?.nftBurn);
        const nftBurnAsset: NFTBurnAsset = data.asset.nftBurn;

        const buffer: ByteBuffer = new ByteBuffer(32, true);

        buffer.append(nftBurnAsset.nftId, "hex");

        return buffer;
    }

    public deserialize(buf): void {
        const { data } = this;

        const nftId = buf.readBytes(32).toString("hex");

        const nftBurn: NFTBurnAsset = {
            nftId: nftId,
        };

        data.asset = {
            nftBurn,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
