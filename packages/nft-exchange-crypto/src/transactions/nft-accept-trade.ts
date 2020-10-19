import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { NFTExchangeTransactionsTypeGroup, NFTStaticFees, NFTTransactionTypes } from "../enums";
import { NFTAcceptTradeAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTAcceptTradeTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static type: number = NFTTransactionTypes.NFTAcceptTrade;
    public static key = "NFTAcceptTrade";
    public static version = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTAcceptTrade);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTAcceptTrade",
            required: ["typeGroup", "asset"],
            properties: {
                type: { transactionType: NFTTransactionTypes.NFTAcceptTrade },
                typeGroup: { const: NFTExchangeTransactionsTypeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["nftAcceptTrade"],
                    properties: {
                        nftAcceptTrade: {
                            type: "object",
                            required: ["auctionId", "bidId"],
                            properties: {
                                auctionId: {
                                    $ref: "transactionId",
                                },
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

        Asserts.assert.defined<NFTAcceptTradeAsset>(data.asset?.nftAcceptTrade);

        const buffer: ByteBuffer = new ByteBuffer(32 + 32, true);

        buffer.append(data.asset.nftAcceptTrade.auctionId, "hex");

        buffer.append(data.asset.nftAcceptTrade.bidId, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftAcceptTrade: NFTAcceptTradeAsset = {
            auctionId: buf.readBytes(32).toString("hex"),
            bidId: buf.readBytes(32).toString("hex"),
        };

        data.asset = {
            nftAcceptTrade,
        };
    }
}
