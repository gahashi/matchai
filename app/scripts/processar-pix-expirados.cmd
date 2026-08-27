@echo off

cd /d C:\brava_pass_produtos\app

echo. >> logs\pix-expirados.log
echo ================================================== >> logs\pix-expirados.log
echo [%date% %time%] Iniciando rotina PIX >> logs\pix-expirados.log

call npm run pix:processar-expirados >> logs\pix-expirados.log 2>&1

echo [%date% %time%] Rotina finalizada >> logs\pix-expirados.log