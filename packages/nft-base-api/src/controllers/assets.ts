import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Builders, Enums } from "@protokol/nft-base-crypto";
import { Indexers, Interfaces } from "@protokol/nft-base-transactions";

import { AssetResource } from "../resources/assets";
import { WalletsResource } from "../resources/wallets";
import { BaseController } from "./base-controller";

const pluginName = require("../../package.json").name;

@Container.injectable()
export class AssetsController extends BaseController {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	@Container.inject(Container.Identifiers.PluginConfiguration)
	@Container.tagged("plugin", pluginName)
	protected readonly configuration!: Providers.PluginConfiguration;

	public async index(request: Hapi.Request) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AssetResource,
		);
	}

	public async showAssetWallet(request: Hapi.Request) {
		let wallet: Contracts.State.Wallet;
		try {
			wallet = this.walletRepository.findByIndex(Indexers.NFTIndexers.NFTTokenIndexer, request.params.id);
		} catch (e) {
			return Boom.notFound("Asset not found or it was burned");
		}

		return this.respondWithResource(wallet, WalletsResource);
	}

	public async show(request: Hapi.Request) {
		const transaction = await this.transactionHistoryService.findOneByCriteria({
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
			id: request.params.id,
		});
		if (!transaction) {
			return Boom.notFound("Asset not found");
		}
		return this.respondWithBlockResource(transaction, request.query.transform, AssetResource);
	}

	public async showWalletAssets(
		request: Hapi.Request,
	): Promise<
		| Boom.Boom
		| Contracts.Search.ResultsPage<ReturnType<AssetResource["raw"]>>
		| Contracts.Search.ResultsPage<ReturnType<AssetResource["transform"]>>
	> {
		let wallet: Contracts.State.Wallet;
		try {
			wallet = this.walletRepository.findByPublicKey(request.params.id);
		} catch (e) {
			return Boom.notFound("Wallet not found");
		}

		const tokenIds = Object.keys(wallet.getAttribute("nft.base.tokenIds", {}));
		const criteria = tokenIds.map((tokenId) => ({
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
			id: tokenId,
		}));

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AssetResource,
		);
	}

	public async showByAsset(request: Hapi.Request) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTBaseTransactionGroup,
			type: Enums.NFTBaseTransactionTypes.NFTCreate,
			asset: { nftToken: { attributes: request.payload } },
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AssetResource,
		);
	}

	public async claimAsset(request: Hapi.Request) {
		const passphrase = this.configuration.get<string>("mintPassphrase");
		if (!passphrase) {
			return Boom.notImplemented();
		}

		const { collectionId, recipientId } = request.payload;
		if (!Identities.Address.validate(recipientId)) {
			return Boom.badData("Address not found");
		}

		let genesisWalletCollection: Interfaces.INFTCollections;
		try {
			const genesisWallet = this.walletRepository.findByIndex(
				Indexers.NFTIndexers.CollectionIndexer,
				collectionId,
			);
			genesisWalletCollection = genesisWallet.getAttribute<Interfaces.INFTCollections>("nft.base.collections");
		} catch (e) {
			return Boom.badData("Collection not found");
		}

		const attributes = genesisWalletCollection[collectionId]!.nftCollectionAsset.metadata!;
		if (!attributes) {
			return Boom.badData("This collection does not support claiming assets");
		}

		const wallet = this.walletRepository.findByAddress(Identities.Address.fromPassphrase(passphrase));
		const nonce = Utils.BigNumber.make(wallet.getNonce()).plus(1).toFixed();
		const createAssetTx = new Builders.NFTCreateBuilder()
			.NFTCreateToken({ collectionId, attributes, recipientId })
			.nonce(nonce)
			.sign(passphrase)
			.build()
			.toJson();

		return createAssetTx;
	}
}
