import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTTransferAsset extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.NFTTransferAsset].name;
	public static flags = {
		...SendBase.defaultFlags,
		recipientId: flags.string({ char: "r", description: "Recipient id - Address" }),
		nftIds: flags.string({ description: "Nft ids separated with comma" }),
	};

	public type = TransactionType.NFTTransferAsset;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.recipientId) {
			config.recipientId = flags.recipientId;
		}
		if (flags.nftIds) {
			mergedConfig.nft.transferAsset.nftIds = flags.nftIds.split(",");
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return NFTTransferAsset;
	}
}
