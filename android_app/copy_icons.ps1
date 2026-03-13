$src = "D:\Project Free\New_Rajawali\android_app\res_output"
$dst = "C:\Users\randi\AndroidStudioProjects\RajawaliApp\app\src\main\res"
$folders = @("mipmap-mdpi","mipmap-hdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi")
foreach ($f in $folders) {
    $srcPath = Join-Path $src $f
    $dstPath = Join-Path $dst $f
    Copy-Item -Path "$srcPath\*" -Destination $dstPath -Force
    Write-Host "Copied to $f"
}
Write-Host "All icons deployed!"
