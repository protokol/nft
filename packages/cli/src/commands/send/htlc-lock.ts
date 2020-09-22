import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class HtlcLock extends SendBase {
    public static description = SendBase.defaultDescription + builders[TransactionType.HtlcLock].name;
    public static flags = {
        ...SendBase.defaultFlags,
        secretHash: flags.string({ description: "sha256 of secret" }),
        expirationType: flags.integer({ description: "Expiration type: 1=EpochTimestamp, 2=BlockHeight" }),
        expirationValue: flags.integer({ description: "Lock expiration in seconds or blocks" }),
        recipientId: flags.string({ char: "r", description: "Recipient id - Address" }),
    };

    public type = TransactionType.HtlcLock;

    protected prepareConfig(config, flags) {
        const mergedConfig = { ...config };
        if (flags.secretHash) {
            mergedConfig.htlc.lock.secretHash = flags.secretHash;
        }
        if (flags.expirationType) {
            mergedConfig.htlc.lock.expiration.type = flags.expirationType;
        }
        if (flags.expirationValue) {
            mergedConfig.htlc.lock.expiration.value = flags.expirationValue;
        }
        if (flags.recipientId) {
            config.recipientId = flags.recipientId;
        }

        return mergedConfig;
    }

    protected getCommand(): any {
        return HtlcLock;
    }
}
