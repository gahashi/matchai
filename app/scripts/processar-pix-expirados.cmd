@echo off

cd /d C:\brava_pass_produtos\app

call npm run pix:processar-expirados >> logs\pix-expirados.log 2>&1