import { Controller } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import { Defaults as CryptoDefaults } from "@protokol/nft-base-crypto";
import { Defaults as TransactionDefaults } from "@protokol/nft-base-transactions";

import { ConfigurationResource } from "../resources/configurations";

const packageName = require("../../package.json").name;
const packageVersion = require("../../package.json").version;

@Container.injectable()
export class ConfigurationController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.respondWithResource(
            {
                packageName,
                packageVersion,
                crypto: CryptoDefaults,
                transactions: TransactionDefaults,
            },
            ConfigurationResource,
        );
    }
}