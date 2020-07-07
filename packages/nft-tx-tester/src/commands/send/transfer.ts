import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class Transfer extends SendBase {
    public static flags = {
        ...SendBase.defaultFlags,
        amount: flags.string({ char: "a", description: "Amount to transfer" }),
        expiration: flags.integer({ char: "e", description: "Expiration is by block height" }),
        recipientId: flags.string({ char: "r", description: "Recipient id - Address" }),
    };

    public type = TransactionType.Transfer;
    public description = SendBase.defaultDescription + builders[this.type].name;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.amount) {
            mergedConfig.amount = flags.amount;
        }
        if (flags.expiration) {
            mergedConfig.expiration = flags.expiration;
        }
        if (flags.recipientId) {
            config.recipientId = flags.recipientId;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return Transfer;
    }
}
