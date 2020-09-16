import { Permissions } from "./groups";

export interface User {
    publicKey: string;
    groups: string[];
    permissions: Permissions[];
}

export interface UserGroups {
    name: "group name";
    priority: 1;
    active: false;
    default: false;
    permissions: Permissions[];
}
