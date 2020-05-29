#!/usr/bin/env bash

cd packages/nft-base-transactions && yarn test:functional:coverage && cd ../..
cd packages/nft-exchange-transactions && yarn test:functional:coverage && cd ../..
