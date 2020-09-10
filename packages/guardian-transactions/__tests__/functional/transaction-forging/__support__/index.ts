import "jest-extended";

import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { DatabaseInteraction, StateBuilder } from "@arkecosystem/core-state";
import { passphrases, Sandbox } from "@arkecosystem/core-test-framework";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import delay from "delay";

jest.setTimeout(1200000);

const sandbox: Sandbox = new Sandbox();

export const setUp = async (): Promise<Contracts.Kernel.Application> => {
    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
        },
        peers: {
            list: [{ ip: "127.0.0.1", port: 4000 }],
        },
        app: require("./app.json"),
    });
    await sandbox.boot(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
                processType: "core",
            },
        });

        Managers.configManager.getMilestone().aip11 = false;
        Managers.configManager.getMilestone().htlcEnabled = false;

        await app.boot();

        Managers.configManager.getMilestone().aip11 = true;
        Managers.configManager.getMilestone().htlcEnabled = true;

        const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
        const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "blockchain",
        );

        await databaseService.saveRound(
            passphrases.map((secret, i) => {
                const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase(secret));

                wallet.setAttribute("delegate", {
                    username: `genesis_${i + 1}`,
                    voteBalance: Utils.BigNumber.make("300000000000000"),
                    forgedFees: Utils.BigNumber.ZERO,
                    forgedRewards: Utils.BigNumber.ZERO,
                    producedBlocks: 0,
                    round: 1,
                    rank: undefined,
                });

                return wallet;
            }),
        );

        const databaseInteraction = app.get<DatabaseInteraction>(Container.Identifiers.DatabaseInteraction);

        await (databaseInteraction as any).initializeActiveDelegates(1);
    });

    return sandbox.app;
};

export const tearDown = async (): Promise<void> => {
    // before shutting down the app, we run wallet bootstrap from database state
    // which we compare to the wallet state we got from actually running the chain from zero with the tests
    const walletRepository = sandbox.app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const mapWallets = (wallet: Contracts.State.Wallet) => {
        const walletAttributes = wallet.getAttributes();
        if (walletAttributes.delegate) {
            // we delete delegate attribute which is not built fully from StateBuilder
            delete walletAttributes.delegate;
        }
        return {
            publicKey: wallet.publicKey,
            balance: wallet.balance,
            nonce: wallet.nonce,
            attributes: walletAttributes,
        };
    };
    const sortWallets = (a: Contracts.State.Wallet, b: Contracts.State.Wallet) =>
        a.publicKey!.localeCompare(b.publicKey!);

    const allByPublicKey = walletRepository
        .allByPublicKey()
        .map((w) => w.clone())
        .sort(sortWallets)
        .map(mapWallets);

    walletRepository.reset();

    await sandbox.app.resolve<StateBuilder>(StateBuilder).run();
    await delay(2000); // if there is an issue with state builder, we wait a bit to be sure to catch it in the logs

    const allByPublicKeyBootstrapped = walletRepository
        .allByPublicKey()
        .map((w) => w.clone())
        .sort(sortWallets)
        .map(mapWallets);
    expect(allByPublicKeyBootstrapped).toEqual(allByPublicKey);
};
