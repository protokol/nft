import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class NFTRegisterCollection extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.NFTRegisterCollection].name;
    public static flags = {
        ...SendBase.defaultFlags,
        registerCollection: flags.string({ description: "Stringified register collection object" }),
    };

    public type = TransactionType.NFTRegisterCollection;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.registerCollection) {
            mergedConfig.nft.registerCollection = JSON.parse(flags.registerCollection);
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return NFTRegisterCollection;
    }
}
