import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { IGroupPermissions, IUserPermissions } from "./interfaces";
import { GuardianIndexers } from "./wallet-indexes";

const pluginName = require("../package.json").name;

interface Permission extends GuardianInterfaces.IPermission {
    isAllowed: boolean;
}

@Container.injectable()
export class PermissionResolver {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", pluginName)
    protected readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.CacheService)
    @Container.tagged("cache", pluginName)
    private readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<IGroupPermissions["name"], IGroupPermissions>;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    private genesisWalletPublicKey: Interfaces.ITransactionData["senderPublicKey"] = undefined;

    public async resolve(transaction: Interfaces.ITransaction): Promise<boolean> {
        const publicKey = transaction.data.senderPublicKey;
        AppUtils.assert.defined<string>(publicKey);

        // allow transactions from first block and masterPublicKey or genesis wallet publicKey
        const masterPublicKey = this.configuration.get<string>("masterPublicKey");
        if (
            publicKey === masterPublicKey ||
            publicKey === this.getGenesisWalletPublicKey() ||
            this.stateStore.getLastBlock().data.height === 1
        ) {
            return true;
        }

        if (this.walletRepository.hasByIndex(GuardianIndexers.UserPermissionsIndexer, publicKey)) {
            const userWallet = this.walletRepository.findByIndex(GuardianIndexers.UserPermissionsIndexer, publicKey);
            const { groups, allow, deny } = userWallet.getAttribute<IUserPermissions>("guardian.userPermissions");

            // check user permissions
            const userPermission = this.findPermissionByTransaction(
                this.transformPermissions(allow, deny),
                transaction,
            );
            if (userPermission) {
                return userPermission.isAllowed;
            }

            // check user's groups permissions
            const userGroups = (await Promise.all(
                groups.map((groupName) => this.groupsPermissionsCache.get(groupName)),
            )) as IGroupPermissions[];
            const groupPermission = this.findPermissionByTransaction(
                this.getSortedAndActivePermissionsFromGroups(userGroups),
                transaction,
            );
            if (groupPermission) {
                return groupPermission.isAllowed;
            }
        }

        // check default groups permissions
        const defaultGroups = (await this.groupsPermissionsCache.values()).filter((group) => group.default);
        const defaultPermission = this.findPermissionByTransaction(
            this.getSortedAndActivePermissionsFromGroups(defaultGroups),
            transaction,
        );
        if (defaultPermission) {
            return defaultPermission.isAllowed;
        }

        // default plugin permission
        return this.configuration.get<boolean>("transactionsAllowedByDefault")!;
    }

    private findPermissionByTransaction(
        permissions: Permission[],
        transaction: Interfaces.ITransaction,
    ): Permission | undefined {
        return permissions.find(
            (permission) =>
                permission.transactionTypeGroup === transaction.typeGroup &&
                permission.transactionType === transaction.type,
        );
    }

    private getSortedAndActivePermissionsFromGroups(groups: IGroupPermissions[]): Permission[] {
        return groups
            .filter((group) => group.active)
            .sort((a, b) => b.priority - a.priority)
            .map((group) => this.transformPermissions(group.allow, group.deny))
            .flat();
    }

    private getGenesisWalletPublicKey() {
        if (!this.genesisWalletPublicKey) {
            const [genesisTx] = this.stateStore.getGenesisBlock().transactions;
            this.genesisWalletPublicKey = genesisTx.data.senderPublicKey;
        }

        return this.genesisWalletPublicKey;
    }

    private transformPermissions(
        allow: GuardianInterfaces.IPermission[],
        deny: GuardianInterfaces.IPermission[],
    ): Permission[] {
        return [...allow.map((x) => ({ ...x, isAllowed: true })), ...deny.map((x) => ({ ...x, isAllowed: false }))];
    }
}
