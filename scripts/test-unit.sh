#!/usr/bin/env bash

cd packages/nft-base-api && yarn test:unit:coverage && cd ../..
cd packages/nft-base-crypto && yarn test:unit:coverage && cd ../..
cd packages/nft-base-transactions && yarn test:unit:coverage && cd ../..
cd packages/nft-exchange-api && yarn test:unit:coverage && cd ../..
cd packages/nft-exchange-transactions && yarn test:unit:coverage && cd ../..
cd packages/nft-exchange-crypto && yarn test:unit:coverage && cd ../..
