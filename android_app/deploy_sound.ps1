$src = "D:\Project Free\New_Rajawali\android_app\raw_output\notification_sound.mp3"
$dst = "C:\Users\randi\AndroidStudioProjects\RajawaliApp\app\src\main\res\raw"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item $src (Join-Path $dst "notification_sound.mp3") -Force
Write-Host "Copied notification_sound.mp3 to res/raw"
