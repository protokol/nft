import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";
import { Transactions as GuardianTransactions } from "@protokol/guardian-crypto";

import { UserInToManyGroupsError } from "../errors";
import { GuardianApplicationEvents } from "../events";
import { IUserPermissions } from "../interfaces";
import { GuardianIndexers } from "../wallet-indexes";
import { GuardianTransactionHandler } from "./guardian-handler";

const pluginName = require("../../package.json").name;

@Container.injectable()
export class GuardianUserPermissionsHandler extends GuardianTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    protected readonly configuration!: Providers.PluginConfiguration;

    public getConstructor(): Transactions.TransactionConstructor {
        return GuardianTransactions.GuardianUserPermissionsTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["guardian.userPermissions"];
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<GuardianInterfaces.GuardianUserPermissionsAsset>(
                transaction.asset?.setUserPermissions,
            );

            const setUserPermissionsAsset: GuardianInterfaces.GuardianUserPermissionsAsset =
                transaction.asset.setUserPermissions;
            const userWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                setUserPermissionsAsset.publicKey,
            );
            const userPermissionsWallet: IUserPermissions = {
                groups: setUserPermissionsAsset.groupNames || [],
                permissions: setUserPermissionsAsset.permissions || [],
            };

            userWallet.setAttribute("guardian.userPermissions", userPermissionsWallet);
            this.walletRepository.index(userWallet);
        }
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(GuardianApplicationEvents.SetUserPermissions, transaction.data);
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        sender: Contracts.State.Wallet,
    ): Promise<void> {
        AppUtils.assert.defined<GuardianInterfaces.GuardianUserPermissionsAsset>(
            transaction.data.asset?.setUserPermissions,
        );
        const setUserPermissionsAsset: GuardianInterfaces.GuardianUserPermissionsAsset =
            transaction.data.asset.setUserPermissions;

        const maxDefinedGroupsPerUser = this.configuration.get<number>("maxDefinedGroupsPerUser");
        if (
            setUserPermissionsAsset.groupNames?.length &&
            setUserPermissionsAsset.groupNames.length > maxDefinedGroupsPerUser!
        ) {
            throw new UserInToManyGroupsError();
        }

        // TODO check if groups exists
        // TODO check if transaction type from permissions exists

        return super.throwIfCannotBeApplied(transaction, sender);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        // Line is already checked inside throwIfCannotBeApplied run by applyToSender method
        // AppUtils.assert.defined<GuardianInterfaces.GuardianUserPermissionsAsset>(
        //     transaction.data.asset?.setUserPermissions,
        // );
        const setUserPermissionsAsset: GuardianInterfaces.GuardianUserPermissionsAsset = transaction.data.asset!
            .setUserPermissions;
        const userWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            setUserPermissionsAsset.publicKey,
        );
        const userPermissionsWallet: IUserPermissions = {
            groups: setUserPermissionsAsset.groupNames || [],
            permissions: setUserPermissionsAsset.permissions || [],
        };

        userWallet.setAttribute("guardian.userPermissions", userPermissionsWallet);
        this.walletRepository.index(userWallet);
    }

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {
        const setUserPermissionsAsset: GuardianInterfaces.GuardianUserPermissionsAsset = transaction.data.asset!
            .setUserPermissions;
        const userWallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
            setUserPermissionsAsset.publicKey,
        );

        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
            asset: {
                setUserPermissions: {
                    publicKey: setUserPermissionsAsset.publicKey,
                },
            },
        };
        const order: Contracts.Search.ListOrder = [
            { property: "timestamp", direction: "desc" },
            { property: "sequence", direction: "desc" },
        ];
        const [lastUserPermissionsTx] = (
            await this.transactionHistoryService.listByCriteria(criteria, order, {
                offset: 0,
                limit: 1,
            })
        ).rows;

        if (!lastUserPermissionsTx) {
            userWallet.forgetAttribute("guardian.userPermissions");
            this.walletRepository
                .getIndex(GuardianIndexers.UserPermissionsIndexer)
                .forget(setUserPermissionsAsset.publicKey);
        } else {
            const userPermissionsWallet: IUserPermissions = {
                groups: lastUserPermissionsTx.asset!.groupNames || [],
                permissions: lastUserPermissionsTx.asset!.permissions || [],
            };

            userWallet.setAttribute("guardian.userPermissions", userPermissionsWallet);
            this.walletRepository.index(userWallet);
        }
    }
}
