# Sincroniza variáveis do .env.local para a Vercel (production + preview)
param(
  [string]$AppUrl = "https://horadafesta.vercel.app"
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) { Write-Error ".env.local não encontrado" }

$vars = @{}
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $key = $line.Substring(0, $i).Trim()
  $val = $line.Substring($i + 1).Trim()
  if ($key -and $val) { $vars[$key] = $val }
}

$vars["NEXT_PUBLIC_APP_URL"] = $AppUrl

$skip = @("SUPABASE_DB_PASSWORD", "ADMIN_PASSWORD", "ADMIN_EMAIL")
$environments = @("production", "preview")

function Add-VercelEnv($name, $value, $target) {
  $value | npx vercel env add $name $target --yes --force 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Falha ao adicionar $name ($target)"
  } else {
    Write-Host "OK $name ($target)"
  }
}

foreach ($target in $environments) {
  foreach ($key in $vars.Keys) {
    if ($skip -contains $key) { continue }
    if (-not $vars[$key]) { continue }
    Add-VercelEnv $key $vars[$key] $target
  }
}

Write-Host "Concluído."
