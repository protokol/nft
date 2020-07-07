import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { Send } from "../send";

export default class Transfer extends Send {
    public static flags = {
        ...Send.defaultFlags,
        amount: flags.string({ char: "a", description: "Amount to transfer" }),
        expiration: flags.integer({ char: "e", description: "Expiration is by block height" }),
    };

    public type = TransactionType.Transfer;
    public description = Send.defaultDescription + builders[this.type].name;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.amount) {
            mergedConfig.amount = flags.amount;
        }
        if (flags.expiration) {
            mergedConfig.expiration = flags.expiration;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return Transfer;
    }
}
