@echo off
cd /d %~dp0
cd ..
npx prettier --write "**/*.{ts,tsx,css,json,md,mdx}"