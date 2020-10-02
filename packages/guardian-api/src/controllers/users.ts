import { Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BaseController } from "./base-controller";

@Container.injectable()
export class UsersController extends BaseController {
	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const pagination = this.getQueryPagination(request.query);

		return this.userSearchService.getUsersPage(pagination);
	}

	public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const user = this.userSearchService.getUser(request.params.id);
		if (!user) {
			return Boom.notFound("User not found");
		}

		return { data: user };
	}

	public async showGroups(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const user = this.userSearchService.getUser(request.params.id);
		if (!user) {
			return Boom.notFound("User not found");
		}

		const groups = await this.groupSearchService.getGroupsByUserGroups(user.groups);
		return { data: groups };
	}
}
