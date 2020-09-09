import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Managers, Utils } from "@arkecosystem/crypto";

const sandbox: Sandbox = new Sandbox();

export const setUp = async () => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
        },
        peers: {
            list: [{ ip: "127.0.0.1", port: 4000 }], // need some peers defined for the app to run
        },
    });
    await sandbox
        .withCoreOptions({
            app: {
                core: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-state",
                        },
                        {
                            package: "@arkecosystem/core-database",
                        },
                        {
                            package: "@arkecosystem/core-transactions",
                        },
                        {
                            package: "@arkecosystem/core-magistrate-transactions",
                        },
                        {
                            package: "@protokol/nft-base-transactions",
                        },
                        {
                            package: "@protokol/nft-exchange-transactions",
                        },
                        {
                            package: "@arkecosystem/core-transaction-pool",
                        },
                        {
                            package: "@arkecosystem/core-p2p",
                        },
                        {
                            package: "@arkecosystem/core-blockchain",
                        },
                        {
                            package: "@arkecosystem/core-api",
                        },
                        {
                            package: "@protokol/nft-base-api",
                        },
                        {
                            package: "@protokol/nft-exchange-api",
                        },
                        {
                            package: "@arkecosystem/core-forger",
                        },
                    ],
                },
                relay: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-state",
                        },
                        {
                            package: "@arkecosystem/core-database",
                        },
                        {
                            package: "@arkecosystem/core-transactions",
                        },
                        {
                            package: "@arkecosystem/core-magistrate-transactions",
                        },
                        {
                            package: "@protokol/nft-base-transactions",
                        },
                        {
                            package: "@arkecosystem/core-transaction-pool",
                        },
                        {
                            package: "@arkecosystem/core-p2p",
                        },
                        {
                            package: "@arkecosystem/core-blockchain",
                        },
                    ],
                },
                forger: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-forger",
                        },
                    ],
                },
            },
        })
        .boot(async ({ app }) => {
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

            await AppUtils.sleep(1000); // give some more time for api server to be up
        });

    return sandbox.app;
};

export const tearDown = async () => sandbox.dispose();

export const calculateRanks = async () => {
    const walletRepository = sandbox.app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const delegateWallets = Object.values(
        walletRepository.allByUsername(),
    ).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) =>
        b
            .getAttribute<Utils.BigNumber>("delegate.voteBalance")
            .comparedTo(a.getAttribute<Utils.BigNumber>("delegate.voteBalance")),
    );

    AppUtils.sortBy(delegateWallets, (wallet) => wallet.publicKey).forEach((delegate, i) => {
        const wallet = walletRepository.findByPublicKey(delegate.publicKey!);
        wallet.setAttribute("delegate.rank", i + 1);

        walletRepository.index(wallet);
    });
};
