import { Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Indexers } from "@protokol/guardian-transactions";

import { GroupResource } from "../resources/groups";
import { UserResource } from "../resources/users";
import { BaseController } from "./base-controller";

@Container.injectable()
export class GroupsController extends BaseController {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const groups = await this.groupsPermissionsCache.values();

        return this.respondWithCollection(groups, GroupResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const group = await this.groupsPermissionsCache.get(request.params.id);
        if (!group) {
            return Boom.notFound("Group not found");
        }

        return this.respondWithResource(group, GroupResource);
    }

    public async showUsers(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const group = await this.groupsPermissionsCache.get(request.params.id);
        if (!group) {
            return Boom.notFound("Group not found");
        }

        const users = this.walletRepository
            .getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
            .values()
            .filter((user) => user.getAttribute("guardian.userPermissions").groups.includes(group.name));

        return this.respondWithCollection(users, UserResource);
    }
}
