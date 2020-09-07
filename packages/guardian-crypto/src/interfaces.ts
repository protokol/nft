import { PermissionKind } from "./enums";

export interface Transaction {
    transactionType: number;
    transactionTypeGroup: number;
}

export interface IPermission {
    types: Transaction[];
    kind: PermissionKind;
}

export interface GuardianUserPermissionsAsset {
    groupNames?: string[];
    publicKey: string;
    permissions?: IPermission[];
}

export interface GuardianGroupPermissionsAsset {
    name: string;
    permissions: IPermission[];
    priority: number;
    active: boolean;
    default: boolean;
}
