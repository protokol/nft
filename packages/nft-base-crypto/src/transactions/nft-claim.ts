import { Transactions, Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
    NFTBaseStaticFees,
    NFTBaseTransactionGroup,
    NFTBaseTransactionTypes,
    NFTBaseTransactionVersion,
} from "../enums";
import { NFTClaimAsset } from "../interfaces";
import { amount, vendorField } from "./utils/schemas";

const { schemas } = Transactions;

export class NFTClaimTransaction extends Transactions.Transaction {
    public static typeGroup: number = NFTBaseTransactionGroup;
    public static type = NFTBaseTransactionTypes.NFTClaim;
    public static key = "NFTClaim";
    public static version = NFTBaseTransactionVersion;

    protected static defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTClaim);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "NFTClaim",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: NFTBaseTransactionTypes.NFTClaim },
                typeGroup: { const: NFTBaseTransactionGroup },
                amount,
                vendorField,
                asset: {
                    type: "object",
                    required: ["nftClaim"],
                    properties: {
                        nftToken: {
                            type: "object",
                            required: ["collectionId"],
                            properties: {
                                collectionId: {
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

        Asserts.assert.defined<NFTClaimAsset>(data.asset?.nftClaim);
        const nftClaim: NFTClaimAsset = data.asset.nftClaim;

        const buffer: ByteBuffer = new ByteBuffer(32, true);
        buffer.append(nftClaim.collectionId, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const collectionId = buf.readBytes(32).toString("hex");

        const nftClaim: NFTClaimAsset = {
            collectionId,
        };

        data.asset = {
            nftClaim,
        };
    }

    public hasVendorField(): boolean {
        return true;
    }
}
