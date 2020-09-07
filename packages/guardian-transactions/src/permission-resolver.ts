import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { Enums, Interfaces as GuardianInterfaces } from "@protokol/guardian-crypto";

import { IUserPermissions } from "./interfaces";
import { GuardianIndexers } from "./wallet-indexes";

const pluginName = require("../package.json").name;

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
    private readonly groupsPermissionsCache!: Contracts.Kernel.CacheStore<
        GuardianInterfaces.GuardianGroupPermissionsAsset["name"],
        GuardianInterfaces.GuardianGroupPermissionsAsset
    >;

    public async resolve(transaction: Interfaces.ITransaction): Promise<boolean> {
        const publicKey = transaction.data.senderPublicKey;
        AppUtils.assert.defined<string>(publicKey);

        if (this.walletRepository.hasByIndex(GuardianIndexers.UserPermissionsIndexer, publicKey)) {
            const userWallet = this.walletRepository.findByIndex(GuardianIndexers.UserPermissionsIndexer, publicKey);
            const { groups, permissions } = userWallet.getAttribute<IUserPermissions>("guardian.userPermissions");

            // check user permissions
            const userPermission = this.findPermissionByTransaction(permissions, transaction);
            if (userPermission) {
                return this.isAllowed(userPermission.kind);
            }

            // check user's groups permissions
            const userGroups = (await Promise.all(
                groups.map((groupName) => this.groupsPermissionsCache.get(groupName)),
            )) as GuardianInterfaces.GuardianGroupPermissionsAsset[];
            const groupPermission = this.findPermissionByTransaction(
                this.getSortedAndActivePermissionsFromGroups(userGroups),
                transaction,
            );
            if (groupPermission) {
                return this.isAllowed(groupPermission.kind);
            }
        }

        // check default groups permissions
        const defaultGroups = (await this.groupsPermissionsCache.values()).filter((group) => group.default);
        const defaultPermission = this.findPermissionByTransaction(
            this.getSortedAndActivePermissionsFromGroups(defaultGroups),
            transaction,
        );
        if (defaultPermission) {
            return this.isAllowed(defaultPermission.kind);
        }

        // default plugin permission
        return this.isAllowed(this.configuration.get<Enums.PermissionKind>("defaultRuleBehaviour")!);
    }

    private findPermissionByTransaction(
        permissions: GuardianInterfaces.IPermission[],
        transaction: Interfaces.ITransaction,
    ): GuardianInterfaces.IPermission | undefined {
        return permissions.find((permission) => {
            return (
                permission.types.findIndex(
                    (tx) =>
                        tx.transactionTypeGroup === transaction.typeGroup && tx.transactionType === transaction.type,
                ) !== -1
            );
        });
    }

    private getSortedAndActivePermissionsFromGroups(
        groups: GuardianInterfaces.GuardianGroupPermissionsAsset[],
    ): GuardianInterfaces.IPermission[] {
        return groups
            .filter((group) => group.active)
            .sort((a, b) => b.priority - a.priority)
            .map((group) => group.permissions)
            .flat();
    }

    private isAllowed(kind: Enums.PermissionKind): boolean {
        return kind === Enums.PermissionKind.Allow;
    }
}
