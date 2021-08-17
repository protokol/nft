import { Identities, Utils } from "@arkecosystem/crypto";
import { AbstractNFTTransaction } from "@protokol/core-nft-crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { defaults } from "../defaults";
import {
    NFTBaseStaticFees,
    NFTBaseTransactionGroup,
    NFTBaseTransactionTypes,
    NFTBaseTransactionVersion,
} from "../enums";
import { NFTTransferAsset } from "../interfaces";

export class NFTTransferTransaction extends AbstractNFTTransaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type: number = NFTBaseTransactionTypes.NFTTransfer;
    public static key = "NFTTransfer";
    public static version = NFTBaseTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTTransfer);

    public static getAssetSchema(): Record<string, any> {
        return {
            type: "object",
            required: ["nftTransfer"],
            properties: {
                nftTransfer: {
                    type: "object",
                    required: ["nftIds", "recipientId"],
                    properties: {
                        nftIds: {
                            type: "array",
                            minItems: defaults.nftTransfer.minItems,
                            maxItems: defaults.nftTransfer.maxItems,
                            uniqueItems: true,
                            items: {
                                $ref: "transactionId",
                            },
                        },
                        recipientId: {
                            $ref: "address",
                        },
                    },
                },
            },
        };
    }
    public serialize(): ByteBuffer {
        const { data } = this;

        Asserts.assert.defined<NFTTransferAsset>(data.asset?.nftTransfer);
        const nftTransfer: NFTTransferAsset = data.asset.nftTransfer;

        const buffer: ByteBuffer = new ByteBuffer(1 + 32 * nftTransfer.nftIds.length + 21, true);

        buffer.writeByte(nftTransfer.nftIds.length);
        for (const nftId of nftTransfer.nftIds) {
            buffer.append(nftId, "hex");
        }

        const { addressBuffer } = Identities.Address.toBuffer(nftTransfer.recipientId);

        buffer.append(addressBuffer);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const numberOfNfts = buf.readUint8();
        const nftIds: string[] = [];
        for (let i = 0; i < numberOfNfts; i++) {
            nftIds.push(buf.readBytes(32).toString("hex"));
        }
        const nftTransfer: NFTTransferAsset = {
            nftIds,
            recipientId: Identities.Address.fromBuffer(buf.readBytes(21).toBuffer()),
        };

        data.asset = {
            nftTransfer,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
