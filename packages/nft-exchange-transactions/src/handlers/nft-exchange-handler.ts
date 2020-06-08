import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";

export abstract class NFTExchangeTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }
}
