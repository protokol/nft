import { Enums } from "@protokol/guardian-crypto";

export const defaults = {
    maxDefinedGroupsPerUser: 20,
    defaultRuleBehaviour: Enums.PermissionKind.Allow,
    masterPublicKey: undefined,
};
