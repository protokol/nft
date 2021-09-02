import { Utils } from "@arkecosystem/crypto";
import { AbstractNFTTransaction } from "@protokol/core-nft-crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import {
    NFTExchangeTransactionsTypeGroup,
    NFTExchangeTransactionVersion,
    NFTStaticFees,
    NFTTransactionTypes,
} from "../enums";
import { NFTAuctionAsset } from "../interfaces";

export class NFTAuctionTransaction extends AbstractNFTTransaction {
    public static override typeGroup: number = NFTExchangeTransactionsTypeGroup;
    public static override type: number = NFTTransactionTypes.NFTAuction;
    public static override key = "NFTAuction";
    public static override version = NFTExchangeTransactionVersion;

    protected static override defaultStaticFee = Utils.BigNumber.make(NFTStaticFees.NFTAuction);

    public static override getAssetSchema(): Record<string, any> {
        return {
            type: "object",
            required: ["nftAuction"],
            properties: {
                nftAuction: {
                    type: "object",
                    required: ["nftIds", "startAmount", "expiration"],
                    properties: {
                        nftIds: {
                            type: "array",
                            minItems: defaults.nftAuction.minItems,
                            maxItems: defaults.nftAuction.maxItems,
                            uniqueItems: true,
                            items: {
                                $ref: "transactionId",
                            },
                        },
                        startAmount: {
                            bignumber: { minimum: 1 },
                        },
                        expiration: {
                            type: "object",
                            required: ["blockHeight"],
                            properties: {
                                blockHeight: {
                                    type: "integer",
                                    minimum: 1,
                                },
                            },
                        },
                    },
                },
            },
        };
    }
    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<NFTAuctionAsset>(data.asset?.nftAuction);
        const nftAuctionAsset = data.asset.nftAuction;

        const buffer: ByteBuffer = new ByteBuffer(32 * nftAuctionAsset.nftIds.length + 8 + 8, true);

        buffer.writeByte(nftAuctionAsset.nftIds.length);
        for (const nftId of nftAuctionAsset.nftIds) {
            buffer.append(nftId, "hex");
        }
        buffer.writeUint64(nftAuctionAsset.startAmount.toString());

        buffer.writeUint32(nftAuctionAsset.expiration.blockHeight);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const numberOfNfts = buf.readUint8();
        const nftIds: string[] = [];
        for (let i = 0; i < numberOfNfts; i++) {
            nftIds.push(buf.readBytes(32).toString("hex"));
        }

        const nftAuction: NFTAuctionAsset = {
            nftIds,
            startAmount: Utils.BigNumber.make(buf.readUint64().toString()),
            expiration: {
                blockHeight: buf.readUint32(),
            },
        };

        data.asset = {
            nftAuction,
        };
    }
}
