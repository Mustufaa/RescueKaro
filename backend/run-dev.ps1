[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$backendDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $backendDirectory

$envFile = Join-Path $backendDirectory '.env'
if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            if ($value.Length -ge 2 -and
                (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                 ($value.StartsWith("'") -and $value.EndsWith("'")))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name, 'Process'))) {
                [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            }
        }
    }
}

function Set-DefaultEnvironmentValue {
    param(
        [Parameter(Mandatory = $true)][string] $Name,
        [Parameter(Mandatory = $true)][string] $Value
    )

    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($Name, 'Process'))) {
        [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    }
}

Set-DefaultEnvironmentValue -Name 'SPRING_PROFILES_ACTIVE' -Value 'dev'
Set-DefaultEnvironmentValue -Name 'DB_HOST' -Value 'localhost'
Set-DefaultEnvironmentValue -Name 'DB_PORT' -Value '5432'
Set-DefaultEnvironmentValue -Name 'DB_NAME' -Value 'rescuekaro_db'
Set-DefaultEnvironmentValue -Name 'DB_USERNAME' -Value 'postgres'
Set-DefaultEnvironmentValue -Name 'SERVER_PORT' -Value '8080'
Set-DefaultEnvironmentValue -Name 'FRONTEND_URL' -Value 'http://localhost:3000'
Set-DefaultEnvironmentValue -Name 'PUBLIC_APP_URL' -Value 'http://localhost:3000'
Set-DefaultEnvironmentValue -Name 'OTP_PROVIDER' -Value 'mock'
if ([string]::IsNullOrWhiteSpace($env:OTP_TEST_CODE) -and [string]::IsNullOrWhiteSpace($env:DEV_OTP_CODE)) {
    Set-DefaultEnvironmentValue -Name 'OTP_TEST_CODE' -Value '000111'
}

$serverPort = 0
if (-not [int]::TryParse($env:SERVER_PORT, [ref] $serverPort) -or
    $serverPort -lt 1 -or $serverPort -gt 65535) {
    Write-Host "SERVER_PORT must be a number between 1 and 65535 (received '$($env:SERVER_PORT)')." -ForegroundColor Red
    exit 1
}

# Fail fast with a useful error instead of prompting for the database password
# and waiting for Maven/Spring Boot before discovering the port collision. A
# socket probe works even when Get-NetTCPConnection needs elevated permissions.
$portProbe = [Net.Sockets.Socket]::new(
    [Net.Sockets.AddressFamily]::InterNetworkV6,
    [Net.Sockets.SocketType]::Stream,
    [Net.Sockets.ProtocolType]::Tcp
)
$portUnavailable = $false
try {
    $portProbe.DualMode = $true
    $portProbe.ExclusiveAddressUse = $true
    $portProbe.Bind([Net.IPEndPoint]::new([Net.IPAddress]::IPv6Any, $serverPort))
}
catch [Net.Sockets.SocketException] {
    $portUnavailable = $true
}
finally {
    $portProbe.Dispose()
}

if ($portUnavailable) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$serverPort/api/v1/health" -TimeoutSec 2
        if ($health.data.status -eq 'UP' -and $health.data.service -eq 'rescuekaro-backend') {
            Write-Host "RescueKaro backend is already running at http://localhost:$serverPort." -ForegroundColor Green
            exit 0
        }
    }
    catch {
        # The port belongs to something else, or the existing backend is unhealthy.
    }

    Write-Host "Port $serverPort is already in use." -ForegroundColor Red
    Write-Host "Stop that process, or set SERVER_PORT to another port in backend\.env and run run-dev.cmd again." -ForegroundColor Yellow
    exit 1
}

$processPassword = [Environment]::GetEnvironmentVariable('DB_PASSWORD', 'Process')
if ([string]::IsNullOrWhiteSpace($processPassword) -or
    $processPassword -match 'replace-with|your-local|<your') {
    $securePassword = Read-Host 'PostgreSQL password for user postgres' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        if ([string]::IsNullOrWhiteSpace($plainPassword)) {
            throw 'A PostgreSQL password is required. Nothing was saved.'
        }
        [Environment]::SetEnvironmentVariable('DB_PASSWORD', $plainPassword, 'Process')
    }
    finally {
        if ($passwordPointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
        }
        $plainPassword = $null
        $securePassword = $null
    }
}

$previousPgPassword = [Environment]::GetEnvironmentVariable('PGPASSWORD', 'Process')
try {
    $psql = Get-Command 'psql.exe' -ErrorAction SilentlyContinue
    $createdb = Get-Command 'createdb.exe' -ErrorAction SilentlyContinue
    if ($null -ne $psql -and $null -ne $createdb) {
        [Environment]::SetEnvironmentVariable(
            'PGPASSWORD',
            [Environment]::GetEnvironmentVariable('DB_PASSWORD', 'Process'),
            'Process'
        )

        $savedErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $connectionOutput = & $psql.Source --no-password --host $env:DB_HOST --port $env:DB_PORT `
                --username $env:DB_USERNAME --dbname postgres --tuples-only --no-align `
                --command 'SELECT datname FROM pg_database;' 2>&1
            $connectionExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $savedErrorActionPreference
        }
        if ($connectionExitCode -ne 0) {
            throw "PostgreSQL login failed. Check the password for user '$($env:DB_USERNAME)' and run run-dev.cmd again."
        }

        if ($connectionOutput -notcontains $env:DB_NAME) {
            Write-Host "Creating local PostgreSQL database '$($env:DB_NAME)'..."
            $ErrorActionPreference = 'Continue'
            try {
                $createOutput = & $createdb.Source --no-password --host $env:DB_HOST --port $env:DB_PORT `
                    --username $env:DB_USERNAME --maintenance-db postgres $env:DB_NAME 2>&1
                $createExitCode = $LASTEXITCODE
            }
            finally {
                $ErrorActionPreference = $savedErrorActionPreference
            }
            if ($createExitCode -ne 0) {
                throw "Could not create PostgreSQL database '$($env:DB_NAME)'."
            }
        }
    }

    & (Join-Path $backendDirectory 'mvnw.cmd') spring-boot:run
    exit $LASTEXITCODE
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    [Environment]::SetEnvironmentVariable('PGPASSWORD', $previousPgPassword, 'Process')
    [Environment]::SetEnvironmentVariable('DB_PASSWORD', $null, 'Process')
}
