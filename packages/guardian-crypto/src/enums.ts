import { defaults } from "./defaults";

export enum GuardianTransactionTypes {
    GuardianSetUserPermissions = 0,
    GuardianSetGroupPermissions = 1,
}

export const GuardianTransactionGroup = defaults.guardianTypeGroup;

export enum GuardianStaticFees {
    GuardianSetUserPermissions = "500000000",
    GuardianSetGroupPermissions = "500000000",
}
