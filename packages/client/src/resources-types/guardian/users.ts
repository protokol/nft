import { Permissions } from "./groups";

export interface User {
    publicKey: string;
    groups: string[];
    permissions: Permissions[];
}

export interface UserGroups {
    name: string;
    priority: number;
    active: boolean;
    default: boolean;
    permissions: Permissions[];
}
