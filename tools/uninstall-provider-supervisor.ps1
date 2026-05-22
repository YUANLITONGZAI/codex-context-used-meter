$ErrorActionPreference = "Stop"
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
if ($PSVersionTable.PSVersion.Major -ge 7) { $PSNativeCommandUseErrorActionPreference = $true }

$taskName = "CodexContextMeterProviderSupervisor"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Output "Uninstalled scheduled task: $taskName"
} else {
  Write-Output "Scheduled task not found: $taskName"
}

$repoPattern = [regex]::Escape($repoRoot.Path)
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object {
    $_.CommandLine -match 'provider-(supervisor|helper)\.js' -and
    ($_.CommandLine -match $repoPattern -or $_.CommandLine -match '\.\\tools\\provider-helper\.js')
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }
