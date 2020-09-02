#!/usr/bin/env bash

cd packages/nft-base-api && yarn test:integration:coverage && cd ../..
cd packages/nft-exchange-api && yarn test:integration:coverage && cd ../..
cd packages/guardian-api && yarn test:integration:coverage && cd ../..
