import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders as NFTBuilders, Interfaces as NFTInterfaces } from "@protokol/nft-base-crypto";

export class NFTBaseTransactionFactory extends TransactionFactory {
    protected constructor(app?: Contracts.Kernel.Application) {
        super(app);
    }

    public static initialize(app?: Contracts.Kernel.Application): NFTBaseTransactionFactory {
        return new NFTBaseTransactionFactory(app);
    }

    public NFTRegisterCollection(nftCollection: NFTInterfaces.NFTCollectionAsset): NFTBaseTransactionFactory {
        this.builder = new NFTBuilders.NFTRegisterCollectionBuilder().NFTRegisterCollectionAsset(nftCollection);

        return this;
    }

    public NFTCreate(nftToken: NFTInterfaces.NFTTokenAsset): NFTBaseTransactionFactory {
        this.builder = new NFTBuilders.NFTCreateBuilder().NFTCreateToken(nftToken);

        return this;
    }

    public NFTTransfer(nftTransfer: NFTInterfaces.NFTTransferAsset): NFTBaseTransactionFactory {
        this.builder = new NFTBuilders.NFTTransferBuilder().NFTTransferAsset(nftTransfer);

        return this;
    }

    public NFTBurn(nftBurn: NFTInterfaces.NFTBurnAsset): NFTBaseTransactionFactory {
        this.builder = new NFTBuilders.NFTBurnBuilder().NFTBurnAsset(nftBurn);

        return this;
    }
}
