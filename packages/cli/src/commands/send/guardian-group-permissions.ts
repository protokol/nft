import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class GuardianGroupPermissions extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.GuardianGroupPermissions].name;
    public static flags = {
        ...SendBase.defaultFlags,
        name: flags.string({ description: "Group name" }),
        priority: flags.integer({ description: "Group priority" }),
        allow: flags.string({ description: "Stringified array of allow permission objects" }),
        deny: flags.string({ description: "Stringified array of deny permission objects" }),
        active: flags.boolean({ description: "Flag for setting group active", default: false }),
        default: flags.boolean({ description: "Flag for setting group as default", default: false }),
    };

    public type = TransactionType.GuardianGroupPermissions;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.name) {
            mergedConfig.guardian.groupPermissions.name = flags.name;
        }
        if (flags.priority) {
            mergedConfig.guardian.groupPermissions.priority = flags.priority;
        }
        if (flags.active !== undefined) {
            mergedConfig.guardian.groupPermissions.active = flags.active;
        }
        if (flags.default !== undefined) {
            mergedConfig.guardian.groupPermissions.default = flags.default;
        }
        if (flags.allow) {
            mergedConfig.guardian.groupPermissions.allow = JSON.parse(flags.allow);
        }
        if (flags.deny) {
            mergedConfig.guardian.groupPermissions.deny = JSON.parse(flags.deny);
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return GuardianGroupPermissions;
    }
}
