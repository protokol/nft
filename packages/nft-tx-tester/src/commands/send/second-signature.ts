import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { Send } from "../send";

export default class SecondSignature extends Send {
    public static flags = {
        ...Send.defaultFlags,
        secondPassphrase: flags.string({ char: "s", description: "Second passphrase" }),
    };

    public type = TransactionType.SecondSignature;
    public description = Send.defaultDescription + builders[this.type].name;

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
