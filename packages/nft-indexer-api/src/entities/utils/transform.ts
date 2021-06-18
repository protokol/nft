import { Utils } from "@arkecosystem/crypto";
import { FindOperator } from "typeorm";

export const transformBigInt = {
	from(value: string | undefined): Utils.BigNumber | undefined {
		if (value !== undefined && value !== null) {
			return Utils.BigNumber.make(value);
		}

		return undefined;
	},
	to(value: Utils.BigNumber | FindOperator<any>): string | undefined {
		if (value !== undefined && value !== null) {
			return value instanceof FindOperator ? value.value : value.toString();
		}

		return undefined;
	},
};
