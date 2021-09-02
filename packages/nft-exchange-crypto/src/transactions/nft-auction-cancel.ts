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
import { NFTAuctionCancel } from "../interfaces";

export class NFTAuctionCancelTransaction extends AbstractNFTTransaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTAuctionCancel;
    public static override key = "NFTAuctionCancel";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTAuctionCancel);

    public static override getAssetSchema(): Record<string, any> {
        return {
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
        };
    }
    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<NFTAuctionCancel>(data.asset?.nftAuctionCancel);

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
