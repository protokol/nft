import { IResponse, Resource } from "@arkecosystem/client";

import { User } from "../../resources-types/guardian";

export class Users extends Resource {
    public async index(): Promise<IResponse<User>> {
        return this.sendGet("guardian/users");
    }

    public async get(publicKey: string): Promise<IResponse<User>> {
        return this.sendGet(`guardian/users/${publicKey}`);
    }

    public async userGroups(publicKey: string): Promise<IResponse<User>> {
        return this.sendGet(`guardian/users/${publicKey}/groups`);
    }
}
