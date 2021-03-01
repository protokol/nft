import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
    NFTBaseStaticFees,
    NFTBaseTransactionGroup,
    NFTBaseTransactionTypes,
    NFTBaseTransactionVersion,
} from "../enums";
import { NFTBurnAsset } from "../interfaces";
import { amount, vendorField } from "./utils/schemas";

const { schemas } = Transactions;

export class NFTBurnTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTBurn;
    public static key = "NFTBurn";
    public static version = NFTBaseTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTBurn);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTBurn",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTBurn },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount,
                vendorField,
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

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftId = buf.readBytes(32).toString("hex");

        const nftBurn: NFTBurnAsset = {
            nftId,
        };

        data.asset = {
            nftBurn,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
