import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTAuction extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.NFTAuction].name;
	public static flags = {
		...SendBase.defaultFlags,
		nftIds: flags.string({ description: "Nft ids separated with comma" }),
		startAmount: flags.integer({ description: "Auction start amount" }),
		expiration: flags.integer({ description: "Auction expiration - block height" }),
	};

	public type = TransactionType.NFTAuction;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.nftIds) {
			mergedConfig.nft.auctionAsset.nftIds = flags.nftIds.split(",");
		}
		if (flags.startAmount) {
			mergedConfig.nft.auctionAsset.startAmount = flags.startAmount;
		}
		if (flags.expiration) {
			mergedConfig.nft.auctionAsset.expiration.blockHeight = flags.expiration;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return NFTAuction;
	}
}
