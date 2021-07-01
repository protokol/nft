import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

import { Asset } from "../entities";

@Container.injectable()
export class AssetResource implements Contracts.Resource {
	/**
	 * Return the raw representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public raw(resource: Asset): object {
		return JSON.parse(JSON.stringify(resource));
	}

	/**
	 * Return the transformed representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public transform(resource: Asset): object {
		const { id, owner, collectionId, attributes } = resource;

		return { id, ownerPublicKey: owner, senderPublicKey: owner, collectionId, attributes };
	}
}
