import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class ConfigurationResource implements Contracts.Resource {
	/**
	 * Return the raw representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public raw(resource): object {
		return JSON.parse(JSON.stringify(resource));
	}

	/**
	 * Return the transformed representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public transform(resource): object {
		return {
			package: {
				name: resource.packageName,
				currentVersion: resource.currentVersion,
				latestVersion: resource.latestVersion,
			},
			crypto: {
				...resource.crypto,
			},
			transactions: {
				...resource.transactions,
			},
		};
	}
}
