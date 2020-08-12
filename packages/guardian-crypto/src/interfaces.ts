import { PermissionKind } from "./enums";

export interface IPermission {
    types: { transactionType: number; transactionTypeGroup: number }[];
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
