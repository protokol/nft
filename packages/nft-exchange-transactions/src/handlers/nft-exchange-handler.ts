import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { FeeType } from "../enums";

const pluginName = require("../../package.json").name;

export abstract class NFTExchangeTransactionHandler extends Handlers.TransactionHandler {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    private readonly configuration!: Providers.PluginConfiguration;

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
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
}
