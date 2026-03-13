Add-Type -AssemblyName System.Drawing

$src = "D:\Project Free\New_Rajawali\android_app\asset\Rajawalimix2.png"
$resDir = "D:\Project Free\New_Rajawali\android_app\res_output"

New-Item -ItemType Directory -Force -Path $resDir | Out-Null

$sizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

$origImg = [System.Drawing.Image]::FromFile($src)

foreach ($key in $sizes.Keys) {
    $size = $sizes[$key]
    $destDir = Join-Path $resDir $key
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($origImg, 0, 0, $size, $size)
    $g.Dispose()

    $bmp.Save((Join-Path $destDir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $destDir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)

    # Also save foreground version for adaptive icons
    $bmp2 = New-Object System.Drawing.Bitmap($size, $size)
    $g2 = [System.Drawing.Graphics]::FromImage($bmp2)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    # Draw with some padding for adaptive icon foreground (80% of size, centered)
    $pad = [int]($size * 0.1)
    $innerSize = $size - ($pad * 2)
    $g2.DrawImage($origImg, $pad, $pad, $innerSize, $innerSize)
    $g2.Dispose()
    $bmp2.Save((Join-Path $destDir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp2.Dispose()

    $bmp.Dispose()
    Write-Host "Saved ${size}x${size} -> $key"
}

$origImg.Dispose()
Write-Host "All done! Check: $resDir"
