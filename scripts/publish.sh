#!/usr/bin/env bash

cd packages
cd nft-base-crypto && npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-base-transactions && npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-base-api && npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-crypto && npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-transactions && npm publish --tag beta --access public --tolerate-republish && cd ..
cd nft-exchange-api && npm publish --tag beta --access public --tolerate-republish && cd ..
