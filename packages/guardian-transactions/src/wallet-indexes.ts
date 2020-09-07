import { Contracts } from "@arkecosystem/core-kernel";

export enum GuardianIndexers {
    UserPermissionsIndexer = "userPermissionsIndexer",
}

export const guardianUserPermissionIndexer = (
    index: Contracts.State.WalletIndex,
    wallet: Contracts.State.Wallet,
): void => {
    if (wallet.publicKey && wallet.hasAttribute("guardian.userPermissions")) {
        index.set(wallet.publicKey, wallet);
    }
};
