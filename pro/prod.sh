#! /usr/bin/bash
git reset HEAD --hard
git pull
cd ../common
bun i
cd ../pro
bun i
bun run build
pm2 restart "zoron-pro"
