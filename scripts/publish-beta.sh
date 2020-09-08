#!/usr/bin/env bash
cd packages/utils && npm publish --tag beta && cd ../..
cd packages/nft-base-crypto && npm publish --tag beta && cd ../..
cd packages/nft-base-transactions && npm publish --tag beta && cd ../..
cd packages/nft-base-api && npm publish --tag beta && cd ../..
cd packages/nft-exchange-crypto && npm publish --tag beta && cd ../..
cd packages/nft-exchange-transactions && npm publish --tag beta && cd ../..
cd packages/nft-exchange-api && npm publish --tag beta && cd ../..
cd packages/guardian-crypto && npm publish --tag beta && cd ../..
cd packages/guardian-transactions && npm publish --tag beta && cd ../..
cd packages/guardian-api && npm publish --tag beta && cd ../..
cd packages/nft-generator-api && npm publish --tag beta && cd ../..
cd packages/nft-client && npm publish --tag beta && cd ../..
`
