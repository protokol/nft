import { Contracts } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class TradeDetailsResource implements Contracts.Resource {
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
			id: resource.transaction.id,
			senderPublicKey: resource.transaction.senderPublicKey,
			completedTrade: {
				auction: {
					id: resource.auction.id,
					...resource.auction.asset.nftAuction,
				},
				bid: {
					id: resource.bid.id,
					...resource.bid.asset.nftBid,
				},
			},
		};
	}
}
