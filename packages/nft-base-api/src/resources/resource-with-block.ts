import { Contracts } from "@arkecosystem/core-api";
import { Utils as AppUtils } from "@arkecosystem/core-kernel";

type Constructor<T = {}> = new (...args: any[]) => T;

export function ResourceWithBlock<T extends Constructor<Contracts.Resource>>(Base: T) {
	return class ResourceWithBlock extends Base {
		public override transform(resource): object {
			const transactionData = resource.data;
			const blockData = resource.block;

			return {
				...super.transform(transactionData),
				timestamp: AppUtils.formatTimestamp(blockData.timestamp),
			};
		}
	};
}
