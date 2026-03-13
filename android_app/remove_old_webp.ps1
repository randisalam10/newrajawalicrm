$resDir = "C:\Users\randi\AndroidStudioProjects\RajawaliApp\app\src\main\res"
$folders = @("mipmap-mdpi","mipmap-hdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")

foreach ($f in $folders) {
    $dir = Join-Path $resDir $f
    # Remove old .webp files that conflict with the new .png ones
    $webpFiles = Get-ChildItem -Path $dir -Filter "*.webp" -ErrorAction SilentlyContinue
    foreach ($file in $webpFiles) {
        Remove-Item $file.FullName -Force
        Write-Host "Removed: $($file.FullName)"
    }
}
Write-Host "All duplicate .webp files removed!"
