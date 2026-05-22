$ErrorActionPreference = "Stop"
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
if ($PSVersionTable.PSVersion.Major -ge 7) { $PSNativeCommandUseErrorActionPreference = $true }

$taskName = "CodexContextMeterProviderSupervisor"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$supervisorPath = Join-Path $repoRoot "tools\provider-supervisor.js"
$node = (Get-Command node.exe -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $supervisorPath)) {
  throw "provider-supervisor.js not found: $supervisorPath"
}

$oldTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($oldTask) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
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

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute $node -Argument "`"$supervisorPath`"" -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Starts the Codex Context Used Meter provider helper only while Codex is running." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Write-Output "Installed and started scheduled task: $taskName"
