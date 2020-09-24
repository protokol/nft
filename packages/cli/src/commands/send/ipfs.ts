import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class Ipfs extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.Ipfs].name;
	public static flags = {
		...SendBase.defaultFlags,
		ipfs: flags.string({ char: "i", description: "Ipfs" }),
	};

	public type = TransactionType.Ipfs;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.ipfs) {
			mergedConfig.ipfs = flags.ipfs;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return Ipfs;
	}
}
