#! /usr/bin/bash
git reset HEAD --hard
git pull
bun i
bun run build
pm2 restart "zoron"
