$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$HealthUrl = 'http://127.0.0.1:4310/api/health'
$AppUrl = 'http://127.0.0.1:4310/#command'
$ChromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

$IsRunning = $false
try {
    $Response = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 1
    $IsRunning = $Response.StatusCode -eq 200
} catch {
    $IsRunning = $false
}

if (-not $IsRunning) {
    Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $ProjectRoot -WindowStyle Hidden
    for ($Attempt = 0; $Attempt -lt 24; $Attempt++) {
        Start-Sleep -Milliseconds 250
        try {
            $Response = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 1
            if ($Response.StatusCode -eq 200) { $IsRunning = $true; break }
        } catch { }
    }
}

if (-not $IsRunning) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('STRATEGY OS n’a pas pu démarrer. Vérifiez que Node.js 22.5+ est installé.', 'STRATEGY OS') | Out-Null
    exit 1
}

if (-not (Test-Path -LiteralPath $ChromePath)) {
    Start-Process $AppUrl
    exit 0
}

Start-Process -FilePath $ChromePath -ArgumentList "--app=$AppUrl", '--start-maximized'
