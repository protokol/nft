import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders as NFTBuilders, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
import { Builders as NFTExchangeBuilders, Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";

export class NFTTransactionFactory extends TransactionFactory {
	protected constructor(app?: Contracts.Kernel.Application) {
		super(app);
	}

	public static initialize(app?: Contracts.Kernel.Application): NFTTransactionFactory {
		return new NFTTransactionFactory(app);
	}

	public NFTAuction(nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset): NFTTransactionFactory {
		this.builder = new NFTExchangeBuilders.NFTAuctionBuilder().NFTAuctionAsset(nftAuctionAsset);

		return this;
	}

	public NFTAuctionCancel(nftCancelSell: NFTExchangeInterfaces.NFTAuctionCancel): NFTTransactionFactory {
		this.builder = new NFTExchangeBuilders.NFTAuctionCancelBuilder().NFTAuctionCancelAsset(nftCancelSell);

		return this;
	}

	public NFTBid(nftBid: NFTExchangeInterfaces.NFTBidAsset): NFTTransactionFactory {
		this.builder = new NFTExchangeBuilders.NFTBidBuilder().NFTBidAsset(nftBid);

		return this;
	}

	public NFTBidCancel(nftCancelBid: NFTExchangeInterfaces.NFTBidCancelAsset): NFTTransactionFactory {
		this.builder = new NFTExchangeBuilders.NFTBidCancelBuilder().NFTBidCancelAsset(nftCancelBid);

		return this;
	}

	public NFTAcceptTrade(nftAcceptTrade: NFTExchangeInterfaces.NFTAcceptTradeAsset): NFTTransactionFactory {
		this.builder = new NFTExchangeBuilders.NftAcceptTradeBuilder().NFTAcceptTradeAsset(nftAcceptTrade);

		return this;
	}

	public NFTRegisterCollection(nftCollection: NFTInterfaces.NFTCollectionAsset): NFTTransactionFactory {
		this.builder = new NFTBuilders.NFTRegisterCollectionBuilder().NFTRegisterCollectionAsset(nftCollection);

		return this;
	}

	public NFTCreate(nftToken: NFTInterfaces.NFTTokenAsset): NFTTransactionFactory {
		this.builder = new NFTBuilders.NFTCreateBuilder().NFTCreateToken(nftToken);

		return this;
	}

	public NFTBurn(nftBurn: NFTInterfaces.NFTBurnAsset): NFTTransactionFactory {
		this.builder = new NFTBuilders.NFTBurnBuilder().NFTBurnAsset(nftBurn);

		return this;
	}

	public NFTTransfer(nftTransfer: NFTInterfaces.NFTTransferAsset): NFTTransactionFactory {
		this.builder = new NFTBuilders.NFTTransferBuilder().NFTTransferAsset(nftTransfer);

		return this;
	}
}
