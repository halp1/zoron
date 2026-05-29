cd main
bun run build
pm2 restart zoron-main
cd ../pro
bun run build
pm2 restart zoron-pro