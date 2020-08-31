import { Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Interfaces } from "@protokol/guardian-crypto";
import { Indexers } from "@protokol/guardian-transactions";

import { GroupResource } from "../resources/groups";
import { UserResource } from "../resources/users";
import { BaseController } from "./base-controller";

@Container.injectable()
export class UsersController extends BaseController {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const users = this.walletRepository.getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer).values();

        return this.respondWithCollection(users, UserResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const user = this.walletRepository
            .getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
            .get(request.params.id);
        if (!user) {
            return Boom.notFound("User not found");
        }

        return this.respondWithResource(user, UserResource);
    }

    public async showGroups(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const user = this.walletRepository
            .getIndex(Indexers.GuardianIndexers.UserPermissionsIndexer)
            .get(request.params.id);
        if (!user) {
            return Boom.notFound("User not found");
        }

        const groups: Interfaces.GuardianGroupPermissionsAsset[] = [];
        for (const groupName of user.getAttribute("guardian.userPermissions").groups) {
            groups.push((await this.groupsPermissionsCache.get(groupName))!);
        }

        return this.respondWithCollection(groups, GroupResource);
    }
}
