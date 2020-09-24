import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class HtlcClaim extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.HtlcClaim].name;
	public static flags = {
		...SendBase.defaultFlags,
		unlockSecret: flags.string({ description: "sha256 of secret" }),
		lockTransactionId: flags.string({ description: "Lock transaction id" }),
	};

	public type = TransactionType.HtlcClaim;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.unlockSecret) {
			mergedConfig.htlc.claim.unlockSecret = flags.unlockSecret;
		}
		if (flags.lockTransactionId) {
			mergedConfig.htlc.claim.lockTransactionId = flags.lockTransactionId;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return HtlcClaim;
	}
}
