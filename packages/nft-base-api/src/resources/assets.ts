import { Contracts } from "@arkecosystem/core-api";
import { Container, Contracts as CoreContracts } from "@arkecosystem/core-kernel";
import { Indexers } from "@protokol/nft-base-transactions";

@Container.injectable()
export class AssetResource implements Contracts.Resource {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: CoreContracts.State.WalletRepository;

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
		let ownerPublicKey: string | undefined;
		try {
			ownerPublicKey = this.walletRepository
				.findByIndex(Indexers.NFTIndexers.NFTTokenIndexer, resource.id)
				.getPublicKey();
		} catch {
			ownerPublicKey = "BURNED";
		}
		return {
			id: resource.id,
			ownerPublicKey,
			senderPublicKey: resource.senderPublicKey,
			...resource.asset.nftToken,
		};
	}
}
