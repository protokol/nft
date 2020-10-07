export interface IPermission {
    transactionType: number;
    transactionTypeGroup: number;
}

export interface IGuardianUserPermissionsAsset {
    groupNames?: string[];
    publicKey: string;
    allow?: IPermission[];
    deny?: IPermission[];
}

export interface IGuardianGroupPermissionsAsset {
    name: string;
    priority: number;
    active: boolean;
    default: boolean;
    allow?: IPermission[];
    deny?: IPermission[];
}
