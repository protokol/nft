import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { NFTExchangeTransactionsTypeGroup, NFTStaticFees, NFTTransactionTypes } from "../enums";
import { NFTBidCancelAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTBidCancelTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static type: number = NFTTransactionTypes.NFTBidCancel;
    public static key = "NFTBidCancel";
    public static version = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTBidCancel);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTBidCancel",
            required: ["typeGroup", "asset"],
            properties: {
                type: { transactionType: NFTTransactionTypes.NFTBidCancel },
                typeGroup: { const: NFTExchangeTransactionsTypeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["nftBidCancel"],
                    properties: {
                        nftBidCancel: {
                            type: "object",
                            required: ["bidId"],
                            properties: {
                                bidId: {
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

        Asserts.assert.defined<NFTBidCancelAsset>(data.asset?.nftBidCancel);

        const buffer: ByteBuffer = new ByteBuffer(32, true);

        buffer.append(data.asset.nftBidCancel.bidId, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftBidCancel: NFTBidCancelAsset = {
            bidId: buf.readBytes(32).toString("hex"),
        };

        data.asset = {
            nftBidCancel,
        };
    }
}
