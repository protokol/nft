#!/usr/bin/env bash

cd packages
cd nft-base-crypto && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-base-transactions && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-base-api && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-crypto && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-transactions && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-api && yarn npm publish --tag beta --access public --tolerate-republish && cd ..
