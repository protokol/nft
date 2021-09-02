import { Utils } from "@arkecosystem/crypto";
import { AbstractNFTTransaction } from "@protokol/core-nft-crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
    NFTExchangeTransactionsTypeGroup,
    NFTExchangeTransactionVersion,
    NFTStaticFees,
    NFTTransactionTypes,
} from "../enums";
import { NFTBidAsset } from "../interfaces";

export class NFTBidTransaction extends AbstractNFTTransaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTBid;
    public static override key = "NFTBid";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTBid);

    public static override getAssetSchema(): Record<string, any> {
        return {
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
        };
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
}
