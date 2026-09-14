$jsonPath = "bd_sgh.json"
$estadalPath = "estadal_cargos.json"

$jsonRaw = Get-Content -Raw $jsonPath -Encoding UTF8
$db = ConvertFrom-Json $jsonRaw

$estadalRaw = Get-Content -Raw $estadalPath -Encoding UTF8
$estadalData = ConvertFrom-Json $estadalRaw

if ($null -eq $db.personal) {
    # Initialize personal with the correct structure
    $db | Add-Member -MemberType NoteProperty -Name "personal" -Value @{
        ESTADAL = @{
            docente = $estadalData
            administrativo = @{}
            obrero = @{}
        }
    }
} else {
    if ($null -eq $db.personal.ESTADAL) {
        $db.personal | Add-Member -MemberType NoteProperty -Name "ESTADAL" -Value @{
            docente = $estadalData
            administrativo = @{}
            obrero = @{}
        }
    } else {
        $db.personal.ESTADAL.docente = $estadalData
    }
}

$newJson = $db | ConvertTo-Json -Depth 10
Set-Content -Path $jsonPath -Value $newJson -Encoding UTF8
Write-Host "Updated bd_sgh.json successfully."
