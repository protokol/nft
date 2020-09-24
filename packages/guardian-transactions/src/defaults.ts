import { Enums } from "@protokol/guardian-crypto";

import { FeeType } from "./enums";

export const defaults = {
    maxDefinedGroupsPerUser: 20,
    defaultRuleBehaviour: Enums.PermissionKind.Allow,
    masterPublicKey: undefined,
    feeType: FeeType.Dynamic,
};
