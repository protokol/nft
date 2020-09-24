import { flags } from "@oclif/command";

import { builders } from "../../builders";
import { TransactionType } from "../../enums";
import { SendBase } from "../../shared/send-base";

export default class DelegateRegistration extends SendBase {
	public static description = SendBase.defaultDescription + builders[TransactionType.DelegateRegistration].name;
	public static flags = {
		...SendBase.defaultFlags,
		delegateName: flags.string({ char: "d", description: "Delegate name" }),
	};

	public type = TransactionType.DelegateRegistration;

	protected prepareConfig(config, flags) {
		const mergedConfig = { ...config };
		if (flags.delegateName) {
			mergedConfig.delegateName = flags.delegateName;
		}

		return mergedConfig;
	}

	protected getCommand(): any {
		return DelegateRegistration;
	}
}
