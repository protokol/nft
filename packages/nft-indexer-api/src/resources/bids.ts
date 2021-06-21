import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

import { Bid } from "../entities";

@Container.injectable()
export class BidsResource implements Contracts.Resource {
	/**
	 * Return the raw representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public raw(resource: Bid): object {
		return JSON.parse(JSON.stringify(resource));
	}

	/**
	 * Return the transformed representation of the resource.
	 *
	 * @param {*} resource
	 * @returns {object}
	 * @memberof Resource
	 */
	public transform(resource: Bid, auctionId?: string): object {
		const { id, senderPublicKey, bidAmount, status } = resource;

		return { id, senderPublicKey, nftBid: { auctionId, bidAmount, status } };
	}
}
