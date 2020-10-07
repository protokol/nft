import { Interfaces } from "@protokol/guardian-crypto";

export interface IUserPermissions {
    groups: string[];
    allow: Interfaces.IPermission[];
    deny: Interfaces.IPermission[];
}

export interface IGroupPermissions extends Interfaces.IGuardianGroupPermissionsAsset {
    allow: Interfaces.IPermission[];
    deny: Interfaces.IPermission[];
}

export const Identifiers = {
    PermissionsResolver: Symbol.for("PermissionsResolver"),
};
