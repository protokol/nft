import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTBid extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.NFTBid].name;
    public static flags = {
        ...SendBase.defaultFlags,
        auctionId: flags.string({ description: "Auction id" }),
        bidAmount: flags.integer({ description: "Bid amount" }),
    };

    public type = TransactionType.NFTBid;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.auctionId) {
            mergedConfig.nft.bidAsset.auctionId = flags.auctionId;
        }
        if (flags.bidAmount) {
            mergedConfig.nft.bidAsset.bidAmount = flags.bidAmount;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return NFTBid;
    }
}
