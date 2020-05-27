#!/usr/bin/env bash

git clone https://github.com/protokol/core-nft --recursive

git submodule foreach -q --recursive \
  'git switch \
  $(git config -f $toplevel/.gitmodules submodule.$name.branch || echo master)'


