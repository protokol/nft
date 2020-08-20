import { Contracts } from "@arkecosystem/core-kernel";
import { TransactionFactory } from "@arkecosystem/core-test-framework";
import { Builders as GuardianBuilders, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

export class GuardianTransactionFactory extends TransactionFactory {
    protected constructor(app?: Contracts.Kernel.Application) {
        super(app);
    }

    public static initialize(app?: Contracts.Kernel.Application): GuardianTransactionFactory {
        return new GuardianTransactionFactory(app);
    }

    public GuardianSetUserPermissions(
        userPermissions: GuardianInterfaces.GuardianUserPermissionsAsset,
    ): GuardianTransactionFactory {
        this.builder = new GuardianBuilders.GuardianUserPermissionsBuilder().GuardianUserPermissions(userPermissions);

        return this;
    }

    public GuardianSetGroupPermissions(
        groupPermissions: GuardianInterfaces.GuardianGroupPermissionsAsset,
    ): GuardianTransactionFactory {
        this.builder = new GuardianBuilders.GuardianGroupPermissionsBuilder().GuardianGroupPermissions(
            groupPermissions,
        );

        return this;
    }
}
