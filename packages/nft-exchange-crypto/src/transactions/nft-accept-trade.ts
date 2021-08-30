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
import { NFTAcceptTradeAsset } from "../interfaces";

export class NFTAcceptTradeTransaction extends AbstractNFTTransaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTAcceptTrade;
    public static override key = "NFTAcceptTrade";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTAcceptTrade);

    public static override getAssetSchema(): Record<string, any> {
        return {
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
        };
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
