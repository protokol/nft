import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers } from "@arkecosystem/crypto";

import { Interfaces as GuardianInterfaces } from "../../../guardian-crypto/dist";

const pluginName = require("../../package.json").name;

export abstract class GuardianTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    protected readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    protected readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", pluginName)
    protected readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<
        GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
        GuardianInterfaces.GuardianGroupPermissionsAsset
    >;

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    protected getDefaultCriteria() {
        return {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
    }

    protected async getLastTxByAsset(asset: Interfaces.ITransactionAsset): Promise<Interfaces.ITransactionData> {
        const criteria = {
            ...this.getDefaultCriteria(),
            asset,
        };
        const order: Contracts.Search.ListOrder = [
            { property: "timestamp", direction: "desc" },
            { property: "sequence", direction: "desc" },
        ];
        const [lastTx] = (
            await this.transactionHistoryService.listByCriteria(criteria, order, {
                offset: 0,
                limit: 1,
            })
        ).rows;

        return lastTx;
    }
}
