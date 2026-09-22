$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Launcher = Join-Path $ProjectRoot 'launch-strategy-os.ps1'
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'STRATEGY OS.lnk'
$PowerShell = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$ChromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $PowerShell
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Launcher`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.Description = 'STRATEGY OS · Transformation Intelligence & ROI'
$Shortcut.WindowStyle = 7
if (Test-Path -LiteralPath $ChromePath) { $Shortcut.IconLocation = "$ChromePath,0" }
$Shortcut.Save()

Write-Output "Raccourci créé : $ShortcutPath"
