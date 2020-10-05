import { Permission } from "./groups";

export interface User {
    publicKey: string;
    groups: string[];
    allow: Permission[];
    deny: Permission[];
}
