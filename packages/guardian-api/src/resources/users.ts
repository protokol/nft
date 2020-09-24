import { Interfaces } from "@protokol/guardian-transactions";

export type UserResource = Interfaces.IUserPermissions & {
    publicKey: string;
};
