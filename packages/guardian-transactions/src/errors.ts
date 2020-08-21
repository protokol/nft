import { Errors } from "@arkecosystem/core-transactions";

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
