import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders as NFTBuilders, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";
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

    public NFTRegisterCollection(nftCollection: NFTInterfaces.NFTCollectionAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTBuilders.NFTRegisterCollectionBuilder().NFTRegisterCollectionAsset(nftCollection);

        return this;
    }

    public NFTCreate(nftToken: NFTInterfaces.NFTTokenAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTBuilders.NFTCreateBuilder().NFTCreateToken(nftToken);

        return this;
    }

    public NFTBurn(nftBurn: NFTInterfaces.NFTBurnAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTBuilders.NFTBurnBuilder().NFTBurnAsset(nftBurn);

        return this;
    }

    public NFTTransfer(nftTransfer: NFTInterfaces.NFTTransferAsset): NFTExchangeTransactionFactory {
        this.builder = new NFTBuilders.NFTTransferBuilder().NFTTransferAsset(nftTransfer);

        return this;
    }
}
