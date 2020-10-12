import { Errors } from "@arkecosystem/core-transactions";

// GuardianPermissions transaction errors
export class DuplicatePermissionsError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because permissions array contains duplicates.`);
    }
}

export class TransactionTypeDoesntExistError extends Errors.TransactionError {
    public constructor() {
        super(`Failed to apply transaction, because permissions array contains transaction type that doesn't exist.`);
    }
}

// GuardianUserPermissions transaction errors
export class UserInToManyGroupsError extends Errors.TransactionError {
    public constructor(numOfGroups: number) {
        super(`Failed to apply transaction, because user cannot belong in more than ${numOfGroups} groups.`);
    }
}

export class GroupDoesntExistError extends Errors.TransactionError {
    public constructor(groupName: string) {
        super(`Failed to apply transaction, because group "${groupName}" doesn't exist.`);
    }
}

// PermissionResolver errors
export class WalletDoesntHavePermissionsError extends Errors.TransactionError {
    public constructor(public readonly type: number, public readonly group: number | undefined) {
        super(`Failed to accept transaction, because wallet doesn't have enough permissions.`);
    }
}

// Fee errors
export class StaticFeeMismatchError extends Errors.TransactionError {
    public constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}
