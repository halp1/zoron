#! /usr/bin/bash
git reset HEAD --hard
git pull
npm i --force
bun run build
pm2 restart "zoron-pro"
