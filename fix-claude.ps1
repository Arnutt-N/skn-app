# Remove API key from current session
$env:ANTHROPIC_API_KEY = ""

# Optional: Remove from user environment
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $null, "User")

# Restart Claude
Write-Host "ANTHROPIC_API_KEY cleared!"
Write-Host "Restarting Claude Code..."

exit
