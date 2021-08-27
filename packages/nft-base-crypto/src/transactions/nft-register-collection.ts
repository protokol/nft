import { Utils } from "@arkecosystem/crypto";
import { Asserts } from "@protokol/utils";
import ByteBuffer from "bytebuffer";

import { AbstractNFTTransaction } from "../../../core-nft-crypto";
import { defaults } from "../defaults";
import {
	NFTBaseStaticFees,
	NFTBaseTransactionGroup,
	NFTBaseTransactionTypes,
	NFTBaseTransactionVersion,
} from "../enums";
import { NFTCollectionAsset } from "../interfaces";
import { stringPattern } from "./utils/schemas";

export class NFTRegisterCollectionTransaction extends AbstractNFTTransaction {
	public static override typeGroup: number = NFTBaseTransactionGroup;
	public static override type = NFTBaseTransactionTypes.NFTRegisterCollection;
	public static override key = "NFTRegisterCollection";
	public static override version = NFTBaseTransactionVersion;

	protected static override defaultStaticFee = Utils.BigNumber.make(NFTBaseStaticFees.NFTRegisterCollection);

	public static override getAssetSchema(): Record<string, any> {
		return {
			type: "object",
			required: ["nftCollection"],
			properties: {
				nftCollection: {
					type: "object",
					required: ["name", "description", "maximumSupply", "jsonSchema"],
					properties: {
						name: {
							allOf: [
								stringPattern,
								{
									minLength: defaults.nftCollectionName.minLength,
									maxLength: defaults.nftCollectionName.maxLength,
								},
							],
						},
						description: {
							allOf: [
								stringPattern,
								{
									minLength: defaults.nftCollectionDescription.minLength,
									maxLength: defaults.nftCollectionDescription.maxLength,
								},
							],
						},
						maximumSupply: {
							type: "integer",
							minimum: 1,
						},
						jsonSchema: {
							type: "object",
							collectionJsonSchemaByteSize: defaults.nftCollectionJsonSchemaByteSize,
						},
						metadata: {
							type: "object",
							tokenAttributesByteSize: defaults.nftTokenAttributesByteSize,
						},
						allowedIssuers: {
							type: "array",
							minItems: defaults.nftCollectionAllowedIssuers.minItems,
							maxItems: defaults.nftCollectionAllowedIssuers.maxItems,
							uniqueItems: true,
							items: {
								$ref: "publicKey",
							},
						},
					},
				},
			},
		};
	}

	public serialize(): ByteBuffer {
		const { data } = this;

		Asserts.assert.defined<NFTCollectionAsset>(data.asset?.nftCollection);
		const nftCollectionAsset: NFTCollectionAsset = data.asset.nftCollection;

		const nameBuffer: Buffer = Buffer.from(nftCollectionAsset.name, "utf8");
		const descriptionBuffer: Buffer = Buffer.from(nftCollectionAsset.description, "utf8");

		const jsonSchemaBuffer: Buffer = Buffer.from(JSON.stringify(nftCollectionAsset.jsonSchema), "utf8");

		const buffersAllowedIssuersPublicKeys: Buffer[] = [];
		if (nftCollectionAsset.allowedIssuers) {
			for (const publicKey of nftCollectionAsset.allowedIssuers) {
				buffersAllowedIssuersPublicKeys.push(Buffer.from(publicKey, "utf8"));
			}
		}

		const metadataBuffer = nftCollectionAsset.metadata
			? Buffer.from(JSON.stringify(nftCollectionAsset.metadata))
			: Buffer.from("");

		const buffer: ByteBuffer = new ByteBuffer(
			nameBuffer.length +
				descriptionBuffer.length +
				8 +
				jsonSchemaBuffer.length +
				3 +
				buffersAllowedIssuersPublicKeys.length * 66 +
				4 +
				metadataBuffer.length,
			true,
		);

		buffer.writeByte(nameBuffer.length);
		buffer.append(nameBuffer, "hex");

		buffer.writeByte(descriptionBuffer.length);
		buffer.append(descriptionBuffer, "hex");

		buffer.writeUint32(nftCollectionAsset.maximumSupply);

		buffer.writeUint32(jsonSchemaBuffer.length);
		buffer.append(jsonSchemaBuffer, "hex");

		buffer.writeByte(buffersAllowedIssuersPublicKeys.length);
		if (nftCollectionAsset.allowedIssuers) {
			for (const buf of buffersAllowedIssuersPublicKeys) {
				buffer.append(buf, "hex");
			}
		}

		buffer.writeUint32(metadataBuffer.length);
		if (nftCollectionAsset.metadata) {
			buffer.append(metadataBuffer, "hex");
		}

		return buffer;
	}

	public deserialize(buf: ByteBuffer): void {
		const { data } = this;

		const nameLength: number = buf.readUint8();
		const name: string = buf.readString(nameLength);

		const descriptionLength: number = buf.readUint8();
		const description: string = buf.readString(descriptionLength);

		const maximumSupply = buf.readUint32();

		const schemaLength: number = buf.readUInt32();
		const jsonSchema = JSON.parse(buf.readBytes(schemaLength).toBuffer().toString("utf8"));

		const nftCollection: NFTCollectionAsset = {
			name,
			description,
			maximumSupply,
			jsonSchema,
		};
		const numberOfSchemaIssuers = buf.readUint8();
		if (numberOfSchemaIssuers !== 0) {
			const allowedSchemaIssuers: string[] = [];
			for (let i = 0; i < numberOfSchemaIssuers; i++) {
				allowedSchemaIssuers.push(buf.readString(66));
			}
			nftCollection.allowedIssuers = allowedSchemaIssuers;
		}

		const metadataLength = buf.readUint32();
		if (metadataLength) {
			nftCollection.metadata = JSON.parse(buf.readBytes(metadataLength).toBuffer().toString("utf8"));
		}

		data.asset = {
			nftCollection,
		};
	}

	public override hasVendorField(): boolean {
		return true;
	}
}
