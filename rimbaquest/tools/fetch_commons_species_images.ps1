param([int]$Limit = 140)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$database = Join-Path $root 'backend\data\RimbaQuest.db'
$output = Join-Path $root 'rimbaquest\assets\species'
$manifestPath = Join-Path $output 'commons-attribution.json'
$manifest = @{}
if (Test-Path $manifestPath) {
  $savedManifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
  foreach ($property in $savedManifest.psobject.Properties) { $manifest[$property.Name] = $property.Value }
}
$rows = & sqlite3.exe -separator '|' $database 'SELECT id, common_name, scientific_name FROM species ORDER BY id;'
$missing = $rows | ForEach-Object {
  $parts = $_ -split '\|', 3
  [pscustomobject]@{ Id = $parts[0]; CommonName = $parts[1]; ScientificName = $parts[2] }
} | Where-Object { -not (Test-Path (Join-Path $output "$($_.Id).jpg")) } | Select-Object -First $Limit

$completed = 0
foreach ($species in $missing) {
  try {
    $query = [uri]::EscapeDataString($species.ScientificName)
    $api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$query&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=900&format=json"
    $result = (& curl.exe -L --fail --silent --show-error --retry 3 --retry-delay 3 $api | ConvertFrom-Json)
    $pages = @($result.query.pages.psobject.Properties | ForEach-Object { $_.Value })
    $choice = $pages | ForEach-Object {
      $info = @($_.imageinfo)[0]
      if ($info.thumburl -and $info.extmetadata.LicenseShortName.value) {
        [pscustomobject]@{ Page = $_; Info = $info; Exact = $_.title.ToLower().Contains($species.ScientificName.ToLower()) }
      }
    } | Sort-Object @{ Expression = 'Exact'; Descending = $true } | Select-Object -First 1
    if (-not $choice) { Write-Output "MISS $($species.Id)"; continue }
    $target = Join-Path $output "$($species.Id).jpg"
    Start-Sleep -Milliseconds 1500
    & curl.exe -L --fail --silent --show-error --retry 3 --retry-delay 3 -o $target $choice.Info.thumburl
    if (-not (Test-Path $target) -or (Get-Item $target).Length -lt 5000) {
      if (Test-Path $target) { Remove-Item -LiteralPath $target }
      throw 'image was not downloaded correctly'
    }
    $manifest[$species.Id] = @{
      species = $species.CommonName; scientific_name = $species.ScientificName; title = $choice.Page.title
      page = $choice.Info.descriptionurl; url = $choice.Info.thumburl
      licence = $choice.Info.extmetadata.LicenseShortName.value; licence_url = $choice.Info.extmetadata.LicenseUrl.value
      author = $choice.Info.extmetadata.Artist.value; attribution = $choice.Info.extmetadata.Attribution.value
    }
    $completed += 1
    Write-Output "OK $($species.Id)"
    Start-Sleep -Milliseconds 1500
  } catch { Write-Output "FAIL $($species.Id): $($_.Exception.Message)" }
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $manifestPath
Write-Output "Downloaded $completed of $($missing.Count) images"
