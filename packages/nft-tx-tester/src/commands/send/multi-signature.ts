import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class MultiSignature extends SendBase {
    public static flags = {
        ...SendBase.defaultFlags,
        participants: flags.string({
            description: "public keys of multi signature participants",
            default:
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
                "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
        }),
        min: flags.integer({
            description: "Minimum number of participants required",
        }),
    };

    public type = TransactionType.MultiSignature;
    public description = SendBase.defaultDescription + builders[this.type].name;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.participants) {
            mergedConfig.multiSignature.asset.participants = flags.participants.split(",");
        }
        if (flags.min) {
            mergedConfig.multiSignature.asset.min = flags.min;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return MultiSignature;
    }
}
