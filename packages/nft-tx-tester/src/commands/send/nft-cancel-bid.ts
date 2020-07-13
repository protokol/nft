import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NftCancelBid extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.NftCancelBid].name;
    public static flags = {
        ...SendBase.defaultFlags,
        bidId: flags.string({ description: "Bid id" }),
    };

    public type = TransactionType.NftCancelBid;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.bidId) {
            mergedConfig.nft.cancelBidAsset.bidId = flags.bidId;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return NftCancelBid;
    }
}
