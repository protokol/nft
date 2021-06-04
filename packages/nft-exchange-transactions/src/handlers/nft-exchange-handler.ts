import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

import { FeeType } from "../enums";
import { StaticFeeMismatchError } from "../errors";

const pluginName = require("../../package.json").name;

export abstract class NFTExchangeTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    protected readonly emitter!: Contracts.Kernel.EventDispatcher;

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    protected getDefaultCriteria(): { typeGroup: number | undefined; type: number | undefined } {
        return {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };
    }

    public dynamicFee({
        addonBytes,
        satoshiPerByte,
        transaction,
        height,
    }: Contracts.Shared.DynamicFeeContext): Utils.BigNumber {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            return this.getConstructor().staticFee({ height });
        }
        if (feeType === FeeType.None) {
            return Utils.BigNumber.ZERO;
        }

        return super.dynamicFee({ addonBytes, satoshiPerByte, transaction, height });
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        const feeType = this.configuration.get<FeeType>("feeType");

        if (feeType === FeeType.Static) {
            const staticFee = this.getConstructor().staticFee();

            if (!transaction.data.fee.isEqualTo(staticFee)) {
                throw new StaticFeeMismatchError(staticFee.toFixed());
            }
        }
        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ): Promise<void> {}
}
