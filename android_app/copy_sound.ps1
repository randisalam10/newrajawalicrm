$rawDir = "D:\Project Free\New_Rajawali\android_app\raw_output"
New-Item -ItemType Directory -Force -Path $rawDir | Out-Null

$src = "D:\Project Free\New_Rajawali\android_app\asset\universfield-new-notification-046-494237.mp3"
$dst = Join-Path $rawDir "notification_sound.mp3"
Copy-Item $src $dst -Force
Write-Host "Copied: $dst"
