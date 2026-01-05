# Start Ollama with correct settings
Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
$env:OLLAMA_ORIGINS="*"
$env:OLLAMA_HOST="0.0.0.0:11434"
Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow -RedirectStandardOutput "ollama.log" -RedirectStandardError "ollama.err"

Write-Host "Ollama started."

# Start Cloudflare Tunnel
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel --url http://localhost:11434" -RedirectStandardOutput "tunnel.log" -RedirectStandardError "tunnel.err"

Write-Host "Tunnel started. Waiting for URL..."
Start-Sleep -Seconds 10

# Get URL from tunnel logs
$logContent = Get-Content tunnel.err -Raw
if ($logContent -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
    $url = $matches[0]
    Write-Host "Tunnel URL: $url" -ForegroundColor Green
    
    # Update .env
    $envFile = "e:\SBF\.env"
    $content = Get-Content $envFile -Raw
    $content = $content -replace 'OLLAMA_API_URL=https://[^\r\n]+', "OLLAMA_API_URL=$url"
    Set-Content $envFile $content.TrimEnd()
    Write-Host "Updated .env with new URL." -ForegroundColor Green
    
    # Verify tunnel is working
    try {
        $response = Invoke-RestMethod -Uri "$url/api/tags" -TimeoutSec 10
        Write-Host "✅ Tunnel is working! Models available:" -ForegroundColor Green
        $response.models | ForEach-Object { Write-Host "  - $($_.name)" }
    } catch {
        Write-Warning "Tunnel URL set but not responding yet. Wait 30 seconds and check manually."
    }
} else {
    Write-Error "Could not find Tunnel URL in logs. Check tunnel.err manually."
}
