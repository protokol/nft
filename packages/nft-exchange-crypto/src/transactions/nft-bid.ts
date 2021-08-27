import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
    NFTExchangeTransactionsTypeGroup,
    NFTExchangeTransactionVersion,
    NFTStaticFees,
    NFTTransactionTypes,
} from "../enums";
import { NFTBidAsset } from "../interfaces";

const { schemas } = Transactions;

export class NFTBidTransaction extends Transactions.Transaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTBid;
    public static override key = "NFTBid";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTBid);

    public static override getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTBid",
            required: ["typeGroup", "asset"],
            properties: {
                type: { transactionType: NFTTransactionTypes.NFTBid },
                typeGroup: { const: NFTExchangeTransactionsTypeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                vendorField: { anyOf: [{ type: "null" }, { type: "string", format: "vendorField" }] },
                asset: {
                    type: "object",
                    required: ["nftBid"],
                    properties: {
                        nftBid: {
                            type: "object",
                            required: ["auctionId", "bidAmount"],
                            properties: {
                                auctionId: {
                                    $ref: "transactionId",
                                },
                                bidAmount: {
                                    bignumber: { minimum: 1 },
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

        Asserts.assert.defined<NFTBidAsset>(data.asset?.nftBid);

        const buffer: ByteBuffer = new ByteBuffer(32 + 8, true);

        buffer.append(data.asset.nftBid.auctionId, "hex");

        buffer.writeUint64(data.asset.nftBid.bidAmount.toString());

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftBid: NFTBidAsset = {
            auctionId: buf.readBytes(32).toString("hex"),
            bidAmount: Utils.BigNumber.make(buf.readUint64().toString()),
        };

        data.asset = {
            nftBid,
        };
    }

    public override hasVendorField(): boolean {
        return true;
    }
}
