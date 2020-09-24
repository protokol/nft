import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class Vote extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.Vote].name;
	public static flags = {
		...SendBase.defaultFlags,
		vote: flags.string({ char: "v", description: "Vote" }),
		unvote: flags.string({ char: "u", description: "Unvote" }),
	};

	public type = TransactionType.Vote;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.vote) {
			mergedConfig.vote = flags.vote;
		}
		if (flags.unvote) {
			mergedConfig.unvote = flags.unvote;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return Vote;
	}
}
