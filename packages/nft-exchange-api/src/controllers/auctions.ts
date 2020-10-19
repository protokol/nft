import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Enums } from "@protokol/nft-exchange-crypto";
import { Indexers } from "@protokol/nft-exchange-transactions";

import { AuctionResource } from "../resources/auctions";
import { AuctionCancelResource } from "../resources/auctions-cancel";
import { WalletResource } from "../resources/wallets";
import { BaseController } from "./base-controller";

@Container.injectable()
export class AuctionsController extends BaseController {
	@Container.inject(Container.Identifiers.WalletRepository)
	@Container.tagged("state", "blockchain")
	private readonly walletRepository!: Contracts.State.WalletRepository;

	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
			type: Enums.NFTTransactionTypes.NFTAuction,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AuctionResource,
		);
	}

	public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await this.transactionHistoryService.findOneByCriteria({
			...request.query,
			typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
			type: Enums.NFTTransactionTypes.NFTAuction,
			id: request.params.id,
		});
		if (!transaction) {
			return Boom.notFound("Auction not found");
		}
		return this.respondWithBlockResource(transaction, request.query.transform, AuctionResource);
	}

	public async showAuctionWallet(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		let wallet: Contracts.State.Wallet;
		try {
			wallet = this.walletRepository.findByIndex(Indexers.NFTExchangeIndexers.AuctionIndexer, request.params.id);
		} catch (e) {
			return Boom.notFound("Auction not found or it was already completed/canceled");
		}

		return this.respondWithResource(wallet, WalletResource);
	}

	public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Search.OrCriteria<Contracts.Shared.TransactionCriteria> = [];
		if (request.payload.senderPublicKey) {
			criteria.push({
				typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
				type: Enums.NFTTransactionTypes.NFTAuction,
				senderPublicKey: request.payload.senderPublicKey,
			});
		}
		if (request.payload.nftIds) {
			criteria.push({
				typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
				type: Enums.NFTTransactionTypes.NFTAuction,
				asset: {
					nftAuction: {
						nftIds: request.payload.nftIds,
					},
				},
			});
		}
		if (request.payload.startAmount) {
			criteria.push({
				typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
				type: Enums.NFTTransactionTypes.NFTAuction,
				asset: {
					nftAuction: {
						startAmount: request.payload.startAmount,
					},
				},
			});
		}
		if (request.payload.expiration) {
			criteria.push({
				typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
				type: Enums.NFTTransactionTypes.NFTAuction,
				asset: {
					nftAuction: {
						expiration: request.payload.expiration,
					},
				},
			});
		}

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AuctionResource,
		);
	}

	public async indexCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const criteria: Contracts.Shared.TransactionCriteria = {
			...request.query,
			typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
			type: Enums.NFTTransactionTypes.NFTAuctionCancel,
		};

		return this.paginateWithBlock(
			criteria,
			this.getListingOrder(request),
			this.getListingPage(request),
			request.query.transform,
			AuctionCancelResource,
		);
	}

	public async showAuctionCanceled(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const transaction = await this.transactionHistoryService.findOneByCriteria({
			...request.query,
			typeGroup: Enums.NFTExchangeTransactionsTypeGroup,
			type: Enums.NFTTransactionTypes.NFTAuctionCancel,
			id: request.params.id,
		});
		if (!transaction) {
			return Boom.notFound("Auction not found");
		}
		return this.respondWithBlockResource(transaction, request.query.transform, AuctionCancelResource);
	}
}
