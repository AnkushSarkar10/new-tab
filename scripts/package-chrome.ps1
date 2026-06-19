$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dist = Join-Path $root "dist"
$build = Join-Path $dist "chrome"
$zip = Join-Path $dist "album-new-tab-chrome.zip"

$rootFullPath = [System.IO.Path]::GetFullPath($root)
$buildFullPath = [System.IO.Path]::GetFullPath($build)
$distFullPath = [System.IO.Path]::GetFullPath($dist)

if (-not $buildFullPath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to build outside the repository: $buildFullPath"
}

New-Item -ItemType Directory -Path $dist -Force | Out-Null

if (Test-Path -LiteralPath $build) {
  Remove-Item -LiteralPath $build -Recurse -Force
}

New-Item -ItemType Directory -Path $build | Out-Null
New-Item -ItemType Directory -Path (Join-Path $build "scripts") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $build "styles") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $build "assets") | Out-Null

Copy-Item -LiteralPath (Join-Path $root "manifest.chrome.json") -Destination (Join-Path $build "manifest.json")
Copy-Item -LiteralPath (Join-Path $root "newtab.html") -Destination $build
Copy-Item -LiteralPath (Join-Path $root "scripts\default-albums.js") -Destination (Join-Path $build "scripts")
Copy-Item -LiteralPath (Join-Path $root "scripts\newtab.js") -Destination (Join-Path $build "scripts")
Copy-Item -LiteralPath (Join-Path $root "scripts\startup.js") -Destination (Join-Path $build "scripts")
Copy-Item -LiteralPath (Join-Path $root "styles\newtab.css") -Destination (Join-Path $build "styles")
Copy-Item -LiteralPath (Join-Path $root "assets\cities") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\dogs") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\kanye") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\kpop") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\mountains") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\planet") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\travis-scott") -Destination (Join-Path $build "assets") -Recurse
Copy-Item -LiteralPath (Join-Path $root "assets\icons") -Destination (Join-Path $build "assets") -Recurse

if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip -Force
}

$packageItems = Get-ChildItem -LiteralPath $build -Force
Compress-Archive -LiteralPath $packageItems.FullName -DestinationPath $zip -Force

if (-not (Test-Path -LiteralPath $zip)) {
  throw "Chrome zip was not created: $zip"
}

$zipInfo = Get-Item -LiteralPath $zip
if ($zipInfo.Length -le 0) {
  throw "Chrome zip is empty: $zip"
}

Write-Host "Chrome package created: $($zipInfo.FullName)"
Write-Host "Chrome package size: $($zipInfo.Length) bytes"
Write-Host "Unpacked test folder: $build"
