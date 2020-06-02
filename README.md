[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# NFT Functionality For ARK Core-v3 Bridgechains

A monorepository containing a set of ARK Core v3 plugins, providing base and exchange NFT Token Support for:
- token creation (JSON Schema based token structure)
- token trading (auction, bid, trade)
- token burning
- full REST API Support (htts://docs.protokol.com)

## List of modules:

1. [NFT BASE API](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-api)
2. [NFT BASE CRYPTO](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-crypto)
3. [NFT BASE TRANSACTIONS](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-base-transactions)
4. [NFT EXCHANGE CRYPTO](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-exchange-crypto)
5. [NFT EXCHANGE TRANSACTIONS](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-exchange-transactions)
6. [NFT EXCHANGE API](https://github.com/protokol/nft-plugins/tree/develop/packages/nft-exchange-api)

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

# Contact Us For Support And Custom Development
info@protokol.com

# License
Copyright (c) Protokol.com 2020

This work is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.](https://creativecommons.org/licenses/by-nc-sa/4.0/)
