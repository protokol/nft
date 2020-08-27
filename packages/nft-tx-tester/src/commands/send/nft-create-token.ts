import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTCreateToken extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.NFTCreateToken].name;
	public static flags = {
		...SendBase.defaultFlags,
		collectionId: flags.string({ description: "Collection id" }),
		attributes: flags.string({ description: "Stringified token attributes object" }),
	};

	public type = TransactionType.NFTCreateToken;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.collectionId) {
			mergedConfig.nft.createAsset.collectionId = flags.collectionId;
		}
		if (flags.attributes) {
			mergedConfig.nft.createAsset.attributes = JSON.parse(flags.attributes);
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return NFTCreateToken;
	}
}
