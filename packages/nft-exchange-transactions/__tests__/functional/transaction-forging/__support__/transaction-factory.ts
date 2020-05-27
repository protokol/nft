import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Contracts } from "@packages/core-kernel";
import { Builders as NFTExchangeBuilders, Interfaces as NFTExchangeInterfaces } from "@protokol/nft-exchange-crypto";

export class NFTExchangeTransactionFactory extends TransactionFactory {
    protected constructor(app?: Contracts.Kernel.Application) {
        super(app);
    }

    public static initialize(app?: Contracts.Kernel.Application): NFTExchangeTransactionFactory {
        return new NFTExchangeTransactionFactory(app);
    }

    public NFTAuction(nftAuctionAsset: NFTExchangeInterfaces.NFTAuctionAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTExchangeBuilders.NFTAuctionBuilder().NFTAuctionAsset(nftAuctionAsset);

        return this;
    }

    public NFTAuctionCancel(nftCancelSell: NFTExchangeInterfaces.NFTAuctionCancel): NFTExchangeTransactionFactory {
        this.builder = new NFTExchangeBuilders.NFTAuctionCancelBuilder().NFTAuctionCancelAsset(nftCancelSell);

        return this;
    }

    public NFTBid(nftBid: NFTExchangeInterfaces.NFTBidAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTExchangeBuilders.NFTBidBuilder().NFTBidAsset(nftBid);

        return this;
    }

    public NFTBidCancel(nftCancelBid: NFTExchangeInterfaces.NFTBidCancelAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTExchangeBuilders.NFTBidCancelBuilder().NFTBidCancelAsset(nftCancelBid);

        return this;
    }

    public NFTAcceptTrade(nftAcceptTrade: NFTExchangeInterfaces.NFTAcceptTradeAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTExchangeBuilders.NftAcceptTradeBuilder().NFTAcceptTradeAsset(nftAcceptTrade);

        return this;
    }
}
