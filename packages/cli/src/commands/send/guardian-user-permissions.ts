import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class GuardianUserPermissions extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.GuardianUserPermissions].name;
    public static flags = {
        ...SendBase.defaultFlags,
        groupNames: flags.string({ description: "Stringified array of group names" }),
        publicKey: flags.string({ description: "User's public key" }),
        allow: flags.string({ description: "Stringified array of allow permission objects" }),
        deny: flags.string({ description: "Stringified array of deny permission objects" }),
    };

    public type = TransactionType.GuardianUserPermissions;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.groupNames) {
            mergedConfig.guardian.userPermissions.groupNames = JSON.parse(flags.groupNames);
        }
        if (flags.publicKey) {
            mergedConfig.guardian.userPermissions.publicKey = flags.publicKey;
        }
        if (flags.allow) {
            mergedConfig.guardian.userPermissions.allow = JSON.parse(flags.allow);
        }
        if (flags.deny) {
            mergedConfig.guardian.userPermissions.deny = JSON.parse(flags.deny);
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return GuardianUserPermissions;
    }
}
