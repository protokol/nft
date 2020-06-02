[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# NFT Functionality For ARK Core-v3 Bridgechains

A monorepository containing a set of ARK Core v3 plugins, providing base and exchange NFT Token Support for ARK Core v3 based bridgechains. Plugins support following main features:

- token creation (JSON Schema based token structure)
- token trading (auction, bid, trade)
- token burning
- full REST API Support (htts://docs.protokol.com) for exchange and crypto.

This work is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## List of plugins:

| Plugin        | Description      | Version
| ------------- |--------------|---|
| [nft-base-api](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-api)   | Base API Functionality | https://img.shields.io/npm/v/@protokol/nft-base-api/beta
| [nft-base-crypto](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-crypto) | Token creation and transaction support |
| [nft-base-transactions](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-transactions) | NFT Core v3 transactions (base) |
| [nft-exchange-api](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-api)   | Exchange API Functionality | 
| [nft-exchange-crypto](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-crypto) | Exchange transaction support |
| [nft-exchange-transactions](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-transactions) | NFT Core v3 transactions (exchange) |
| [nft-generator-api](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-generator-api) | Helper plugin for quick transaction creation |

## Source install
### Development environment setup

Development environment is setup in the same way as we setup ARK Core v3 development environment. To Learn more about how to achieve this check this link:
https://learn.ark.dev/core-getting-started/setting-up-your-development-environment

### Source Code Setup

```bash
git clone https://github.com/protokol/core-nft
cd core-nft
git clone https://github.com/protokol/nft-plugins protokol/

# run yarn setup from root folder
yarn setup:clean
```

### Run Local Testnet

Check here how to run your local Testnet:
https://learn.ark.dev/core-getting-started/spinning-up-your-first-testnet

# Contact us for support and custom development
info@protokol.com

# License
Copyright (c) Protokol.com 2020

This work is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.](https://creativecommons.org/licenses/by-nc-sa/4.0/)
