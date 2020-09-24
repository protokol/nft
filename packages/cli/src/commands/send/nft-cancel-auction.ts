import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTCancelAuction extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.NFTCancelAuction].name;
	public static flags = {
		...SendBase.defaultFlags,
		auctionId: flags.string({ description: "Auction id" }),
	};

	public type = TransactionType.NFTCancelAuction;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.auctionId) {
			mergedConfig.nft.cancelAuction.auctionId = flags.auctionId;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return NFTCancelAuction;
	}
}
