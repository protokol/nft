import { Interfaces } from "@protokol/guardian-crypto";

export interface IUserPermissions {
    groups: string[];
    permissions: Interfaces.IPermission[];
}

export const Identifiers = {
    PermissionsResolver: Symbol.for("PermissionsResolver"),
};
