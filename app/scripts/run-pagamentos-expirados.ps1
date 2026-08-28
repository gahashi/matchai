Set-Location "C:\brava_pass_produtos_prod\app"

"===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =====" |
    Out-File "C:\brava_pass_produtos_prod\app\logs\pagamentos-expirados.log" -Append

npm run pix:processar-expirados *>> "C:\brava_pass_produtos_prod\app\logs\pagamentos-expirados.log"