import * as AppUtils from "@arkecosystem/core-kernel/dist/utils";
import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { NFTExchangeTransactionsTypeGroup, NFTStaticFees, NFTTransactionTypes } from "../enums";
import { NFTAuctionCancel } from "../interfaces";

const { schemas } = Transactions;

export class NFTAuctionCancelTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static type: number = NFTTransactionTypes.NFTAuctionCancel;
    public static key: string = "NFTAuctionCancel";
    public static version: number = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTAuctionCancel);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTAuctionCancel",
            required: ["typeGroup", "asset"],
            properties: {
                type: { transactionType: NFTTransactionTypes.NFTAuctionCancel },
                typeGroup: { const: NFTExchangeTransactionsTypeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["nftAuctionCancel"],
                    properties: {
                        nftAuctionCancel: {
                            type: "object",
                            required: ["auctionId"],
                            properties: {
                                auctionId: {
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

        AppUtils.assert.defined<NFTAuctionCancel>(data.asset?.nftAuctionCancel);

        const buffer: ByteBuffer = new ByteBuffer(32, true);

        buffer.append(data.asset.nftAuctionCancel.auctionId, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftAuctionCancel: NFTAuctionCancel = {
            auctionId: buf.readBytes(32).toString("hex"),
        };

        data.asset = {
            nftAuctionCancel,
        };
    }
}
