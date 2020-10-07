import { Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { UserCriteria, userCriteriaSchemaObject } from "../resources";
import { BaseController } from "./base-controller";

@Container.injectable()
export class UsersController extends BaseController {
	public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
		const pagination = this.getQueryPagination(request.query);
		const criteria = this.getQueryCriteria(request.query, userCriteriaSchemaObject) as UserCriteria;

		return this.userSearchService.getUsersPage(pagination, criteria);
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
