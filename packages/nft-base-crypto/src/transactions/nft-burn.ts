import { Utils } from "@arkecosystem/crypto";
import { AbstractNFTTransaction } from "@protokol/core-nft-crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import {
	NFTBaseStaticFees,
	NFTBaseTransactionGroup,
	NFTBaseTransactionTypes,
	NFTBaseTransactionVersion,
} from "../enums";
import { NFTBurnAsset } from "../interfaces";

export class NFTBurnTransaction extends AbstractNFTTransaction {
	public static override typeGroup: number = NFTBaseTransactionGroup;
	public static override type = NFTBaseTransactionTypes.NFTBurn;
	public static override key = "NFTBurn";
	public static override version = NFTBaseTransactionVersion;

	protected static override defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTBurn);

	public static override getAssetSchema(): Record<string, any> {
		return {
			type: "object",
			required: ["nftBurn"],
			properties: {
				nftBurn: {
					type: "object",
					required: ["nftId"],
					properties: {
						nftId: {
							$ref: "transactionId",
						},
					},
				},
			},
		};
	}

	public serialize(): ByteBuffer {
		const { data } = this;

		Asserts.assert.defined<NFTBurnAsset>(data.asset?.nftBurn);
		const nftBurnAsset: NFTBurnAsset = data.asset.nftBurn;

		const buffer: ByteBuffer = new ByteBuffer(32, true);

		buffer.append(nftBurnAsset.nftId, "hex");

		return buffer;
	}

	public deserialize(buf: ByteBuffer): void {
		const { data } = this;

		const nftId = buf.readBytes(32).toString("hex");

		const nftBurn: NFTBurnAsset = {
			nftId,
		};

		data.asset = {
			nftBurn,
		};
	}

	public override hasVendorField(): boolean {
		return true;
	}
}
