import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";
import { Transactions as GuardianTransactions } from "@protokol/guardian-crypto";

import { GuardianApplicationEvents } from "../events";
import { GuardianTransactionHandler } from "./guardian-handler";

@Container.injectable()
export class GuardianGroupPermissionsHandler extends GuardianTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return GuardianTransactions.GuardianGroupPermissionsTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(): Promise<void> {
        for await (const transaction of this.transactionHistoryService.streamByCriteria(this.getDefaultCriteria())) {
            AppUtils.assert.defined<GuardianInterfaces.GuardianGroupPermissionsAsset>(
                transaction.asset?.setGroupPermissions,
            );

            const setGroupPermissionsAsset: GuardianInterfaces.GuardianGroupPermissionsAsset =
                transaction.asset.setGroupPermissions;
            this.groupsPermissionsCache.put(setGroupPermissionsAsset.name, setGroupPermissionsAsset, -1);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(GuardianApplicationEvents.SetGroupPermissions, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<GuardianInterfaces.GuardianGroupPermissionsAsset>(
            transaction.data.asset?.setGroupPermissions,
        );

        const setGroupPermissionsAsset: GuardianInterfaces.GuardianGroupPermissionsAsset =
            transaction.data.asset.setGroupPermissions;

        // TODO check if transaction type from permissions exists
        this.checkUniquePermissions(setGroupPermissionsAsset.permissions);

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        const { name }: GuardianInterfaces.GuardianGroupPermissionsAsset = transaction.data.asset!.setGroupPermissions;
        const hasGroupPermissionsTx: boolean = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.setGroupPermissions.name === name)
            .has();

        if (hasGroupPermissionsTx) {
            throw new Contracts.TransactionPool.PoolError(
                `Guardian setGroupPermissions, group permissions change for "${name}" already in pool`,
                "ERR_PENDING",
            );
        }
    }

    public async apply(transaction: Interfaces.ITransaction): Promise<void> {
        await super.apply(transaction);

        // Line is already checked inside throwIfCannotBeApplied run by super.apply method
        // AppUtils.assert.defined<GuardianInterfaces.GuardianGroupPermissionsAsset>(
        //     transaction.data.asset?.setGroupPermissions,
        // );
        const setGroupPermissionsAsset: GuardianInterfaces.GuardianGroupPermissionsAsset = transaction.data.asset!
            .setGroupPermissions;
        this.groupsPermissionsCache.put(setGroupPermissionsAsset.name, setGroupPermissionsAsset, -1);
    }

    public async revert(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revert(transaction);

        const setGroupPermissionsAsset: GuardianInterfaces.GuardianGroupPermissionsAsset = transaction.data.asset!
            .setGroupPermissions;

        const lastGroupPermissionsTx = await this.getLastTxByAsset({
            setGroupPermissions: {
                name: setGroupPermissionsAsset.name,
            },
        });

        if (!lastGroupPermissionsTx) {
            this.groupsPermissionsCache.forget(setGroupPermissionsAsset.name);
        } else {
            this.groupsPermissionsCache.put(
                setGroupPermissionsAsset.name,
                lastGroupPermissionsTx.asset!.setGroupPermissions,
                -1,
            );
        }
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
