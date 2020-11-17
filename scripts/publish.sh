#!/usr/bin/env bash

cd packages
cd nft-base-crypto && yarn publish:beta && cd ..
cd nft-base-transactions && yarn publish:beta && cd ..
cd nft-base-api && yarn publish:beta && cd ..
cd nft-exchange-crypto && yarn publish:beta && cd ..
cd nft-exchange-transactions && yarn publish:beta && cd ..
cd nft-exchange-api && yarn publish:beta && cd ..
