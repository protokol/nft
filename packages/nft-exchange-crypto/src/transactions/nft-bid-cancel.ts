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
import { NFTBidCancelAsset } from "../interfaces";

export class NFTBidCancelTransaction extends AbstractNFTTransaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTBidCancel;
    public static override key = "NFTBidCancel";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTBidCancel);

    public static override getAssetSchema(): Record<string, any> {
        return {
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
        };
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
