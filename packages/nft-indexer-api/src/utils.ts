import Hapi from "@hapi/hapi";

export const changeRouteHandler = (server: Hapi.Server, method: string, oldPath: string, newPath: string): void => {
	const oldRoute = getRouteFromServer(server, method, oldPath);
	if (!oldRoute) {
		return;
	}

	const newRoute = getRouteFromServer(server, method, newPath);
	const handler = newRoute.settings.handler.bind(newRoute.settings.bind);
	oldRoute.settings.handler = handler;
};

const getRouteFromServer = (server: Hapi.Server, method, path) =>
	server.table().find((route) => route.method === method && route.path === path);
