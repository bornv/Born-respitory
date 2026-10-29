param([string]$SetupPath = 'release/Materiaalprijs-Converter-Setup-2.1.0-x64.exe')
$ErrorActionPreference = 'Stop'
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$setup = (Resolve-Path $SetupPath).Path
$installDir = Join-Path $env:RUNNER_TEMP ('ConverterSetupQA-' + [guid]::NewGuid().ToString('N'))
$appExe = Join-Path $installDir 'Materiaalprijs Converter.exe'
$uninstaller = Join-Path $installDir 'Uninstall Materiaalprijs Converter.exe'
$desktopLink = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'Materiaalprijs Converter.lnk'
$startLink = Join-Path ([Environment]::GetFolderPath('Programs')) 'JBT Marel/Materiaalprijs Converter.lnk'
$checks = [Collections.Generic.List[string]]::new()
$marker = $null
$fixture = Join-Path $env:RUNNER_TEMP ('converter-supplier-' + [guid]::NewGuid().ToString('N') + '.xlsx')

function Check([bool]$Ok, [string]$Name) {
    if (-not $Ok) { throw "Setupcontrole mislukt: $Name" }
    $checks.Add($Name)
    Write-Host "OK $Name"
}
function Run-SetupProcess([string]$File, [string[]]$Arguments) {
    $process = Start-Process -FilePath $File -ArgumentList $Arguments -PassThru
    if (-not $process.WaitForExit(120000)) { $process.Kill(); throw "Timeout: $File" }
    $process.Refresh()
    if ($process.ExitCode -ne 0) { throw "Proces eindigde met $($process.ExitCode): $File" }
}
function Get-AppRegistration {
    @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall') |
        ForEach-Object { if (Test-Path $_) { Get-ChildItem $_ | ForEach-Object { Get-ItemProperty $_.PSPath } } } |
        Where-Object { $_.DisplayName -eq 'JBT Marel Materiaalprijs Converter' }
}
function Wait-Removed([string]$File) {
    $deadline = (Get-Date).AddSeconds(60)
    while ((Test-Path $File) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
    if (Test-Path $File) { throw "Bestand bleef bestaan na verwijderen: $File" }
}
$previousExecutable = $env:CONVERTER_EXE
try {
    Check (-not (Test-Path $installDir)) 'Geisoleerde installatiemap'
    Check (@(Get-AppRegistration).Count -eq 0) 'Geen bestaande gebruikersinstallatie in de testomgeving'
    Run-SetupProcess $setup @('/S', '/currentuser', "/D=$installDir")
    Check (Test-Path $appExe) 'Setup installeert de app in de gekozen map'
    # Windows bewaart de productversie in vier delen (2.1.0 wordt 2.1.0.0).
    $installedVersion = (Get-Item $appExe).VersionInfo.ProductVersion
    Check ($installedVersion -eq $version -or $installedVersion -eq "$version.0") "Geinstalleerde exe heeft de juiste versie ($installedVersion)"
    Check (Test-Path (Join-Path $installDir 'LEESMIJ-WINDOWS.txt')) 'Handleiding is meegeinstalleerd'
    Check (Test-Path (Join-Path $installDir 'Materiaalprijs-Converter-invulformat.xlsx')) 'Leveranciersformat is meegeinstalleerd'
    Check (Test-Path $uninstaller) 'Verwijderprogramma is aanwezig'
    Check (Test-Path $desktopLink) 'Bureaubladsnelkoppeling is aangemaakt'
    Check (Test-Path $startLink) 'JBT Marel-snelkoppeling in Start is aangemaakt'
    $shell = New-Object -ComObject WScript.Shell
    foreach ($link in @($desktopLink, $startLink)) {
        Check ($shell.CreateShortcut($link).TargetPath -eq $appExe) "Snelkoppeling verwijst naar de geinstalleerde app: $([IO.Path]::GetFileName($link))"
    }
    $registration = @(Get-AppRegistration)
    Check ($registration.Count -eq 1) 'App is geregistreerd bij Geinstalleerde apps voor de huidige gebruiker'
    Check ($registration[0].DisplayVersion -eq $version) 'Verwijderregistratie heeft de juiste versie'
    Check ($registration[0].UninstallString -match [regex]::Escape($uninstaller)) 'Windows-verwijderregistratie verwijst naar de juiste uninstaller'

    $env:CONVERTER_EXE = $appExe
    & node scripts/smoke-test.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Gebruikstest van de geinstalleerde app is mislukt' }
    $smoke = Get-Content release/qa/smoke.json -Raw | ConvertFrom-Json
    Check ($smoke.appPath.StartsWith($installDir, [StringComparison]::OrdinalIgnoreCase)) 'Gebruikstest draait op de echt geinstalleerde app'
    $marker = Join-Path $smoke.userDataDirectory 'setup-qa-preserve.txt'
    New-Item -ItemType Directory -Force $smoke.userDataDirectory | Out-Null
    'retain-user-settings' | Set-Content $marker
    Copy-Item dist/Materiaalprijs-Converter-invulformat.xlsx $fixture
    $fixtureHash = (Get-FileHash $fixture -Algorithm SHA256).Hash

    Run-SetupProcess $setup @('/S', '/currentuser', "/D=$installDir")
    Check (Test-Path $appExe) 'Opnieuw installeren slaagt'
    Check ((Get-Content $marker -Raw).Trim() -eq 'retain-user-settings') 'Opnieuw installeren behoudt gebruikersinstellingen'
    Check ((Get-FileHash $fixture -Algorithm SHA256).Hash -eq $fixtureHash) 'Opnieuw installeren laat een leveranciersbestand ongewijzigd'
    Check ((Test-Path $desktopLink) -and (Test-Path $startLink)) 'Snelkoppelingen blijven bruikbaar na opnieuw installeren'

    Run-SetupProcess $uninstaller @('/S', '/currentuser')
    Wait-Removed $appExe
    $deadline = (Get-Date).AddSeconds(30)
    while (((@(Get-AppRegistration).Count -gt 0) -or (Test-Path $desktopLink) -or (Test-Path $startLink)) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
    Check (-not (Test-Path $appExe)) 'Verwijderen wist de app'
    Check (@(Get-AppRegistration).Count -eq 0) 'Verwijderen wist de Windows-verwijderregistratie'
    Check ((-not (Test-Path $desktopLink)) -and (-not (Test-Path $startLink))) 'Verwijderen wist de snelkoppelingen'
    Check ((Get-Content $marker -Raw).Trim() -eq 'retain-user-settings') 'Verwijderen behoudt gebruikersinstellingen'
    Check ((Get-FileHash $fixture -Algorithm SHA256).Hash -eq $fixtureHash) 'Verwijderen laat een leveranciersbestand ongewijzigd'

    $report = @{version=$version; platform='win32'; installer='NSIS assisted'; checks=$checks.ToArray(); limitations='Stille installatie voor huidige gebruiker. Geen handmatige wizardtest, geen elevatie/all-users test en geen upgrade vanaf een oudere geinstalleerde versie.'}
    New-Item -ItemType Directory -Force release/qa | Out-Null
    $report | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 release/qa/setup-test.json
    $report | ConvertTo-Json -Depth 5 | Write-Host
} finally {
    $env:CONVERTER_EXE = $previousExecutable
    if (Test-Path $appExe) {
        if (Test-Path $uninstaller) {
            try { Run-SetupProcess $uninstaller @('/S', '/currentuser'); Wait-Removed $appExe } catch { Write-Warning $_ }
        }
    }
    if ($marker -and (Test-Path $marker)) { Remove-Item $marker }
    if (Test-Path $fixture) { Remove-Item $fixture }
}
