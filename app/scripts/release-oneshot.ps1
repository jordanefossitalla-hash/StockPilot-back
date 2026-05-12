Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [switch]$SkipDocker,
  [switch]$SkipSmoke,
  [string]$ApiBaseUrl = 'http://localhost:4000/api/v1',
  [int]$HealthTimeoutSeconds = 90
)

$apiProcess = $null

function Invoke-Step {
  param(
    [string]$Title,
    [string]$Command
  )

  Write-Host "[ONE-SHOT] $Title"
  Invoke-Expression $Command
}

try {
  if (-not $SkipDocker) {
    Invoke-Step -Title 'Starting PostgreSQL container' -Command 'docker compose up -d db'
  }

  Invoke-Step -Title 'Installing dependencies' -Command 'npm install'
  Invoke-Step -Title 'Generating Prisma client' -Command 'npm run prisma:generate'
  Invoke-Step -Title 'Applying migrations' -Command 'npm run prisma:migrate'
  Invoke-Step -Title 'Seeding demo data' -Command 'npm run prisma:seed'
  Invoke-Step -Title 'Building API' -Command 'npm run build'

  Write-Host '[ONE-SHOT] Starting API in background (node dist/main.js)'
  $apiProcess = Start-Process -FilePath 'node' -ArgumentList 'dist/main.js' -PassThru

  Write-Host '[ONE-SHOT] Waiting for health endpoint'
  $deadline = [DateTime]::UtcNow.AddSeconds($HealthTimeoutSeconds)
  $healthy = $false

  while ([DateTime]::UtcNow -lt $deadline) {
    try {
      $health = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get -TimeoutSec 2
      if ($health.status -eq 'ok') {
        $healthy = $true
        break
      }
    }
    catch {
      # Continue retry loop until timeout.
    }
  }

  if (-not $healthy) {
    throw "API did not become healthy within ${HealthTimeoutSeconds}s"
  }

  if (-not $SkipSmoke) {
    Write-Host '[ONE-SHOT] Running smoke tests'
    $env:API_BASE_URL = $ApiBaseUrl
    Invoke-Step -Title 'Smoke test run' -Command 'npm run test:smoke'
  }

  Write-Host '[ONE-SHOT] SUCCESS - release one-shot completed.'
}
finally {
  if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
    Write-Host '[ONE-SHOT] Stopping background API process'
    Stop-Process -Id $apiProcess.Id -Force
  }
}
