import { Permissions } from "./groups";

export interface User {
    publicKey: string;
    groups: string[];
    permissions: Permissions[];
}
