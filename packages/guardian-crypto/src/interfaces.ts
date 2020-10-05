export interface IPermission {
    transactionType: number;
    transactionTypeGroup: number;
}

export interface GuardianUserPermissionsAsset {
    groupNames?: string[];
    publicKey: string;
    allow?: IPermission[];
    deny?: IPermission[];
}

export interface GuardianGroupPermissionsAsset {
    name: string;
    priority: number;
    active: boolean;
    default: boolean;
    allow?: IPermission[];
    deny?: IPermission[];
}
