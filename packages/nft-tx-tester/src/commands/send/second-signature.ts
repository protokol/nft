import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class SecondSignature extends SendBase {
    public static flags = {
        ...SendBase.defaultFlags,
        secondPassphrase: flags.string({ char: "s", description: "Second passphrase" }),
    };

    public type = TransactionType.SecondSignature;
    public description = SendBase.defaultDescription + builders[this.type].name;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.secondPassphrase) {
            mergedConfig.secondPassphrase = flags.secondPassphrase;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return SecondSignature;
    }
}
