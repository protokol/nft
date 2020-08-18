import { Errors } from "@arkecosystem/core-transactions";

// GuardianUserPermissions transaction errors
export class UserInToManyGroupsError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because user cannot belong in so many groups.`);
    }
}
