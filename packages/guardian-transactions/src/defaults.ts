import { FeeType } from "./enums";

export const defaults = {
    maxDefinedGroupsPerUser: 20,
    transactionsAllowedByDefault: true,
    masterPublicKey: undefined,
    feeType: FeeType.Dynamic,
};
