$ErrorActionPreference = "Continue"
Add-Type -AssemblyName System.Drawing

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
$dir = "web/public/images/products"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$products = @(
  @{Name="Logitech MK270 Wireless Keyboard and Mouse Combo"; File="logitech-mk270-wireless-keyboard-and-mouse-combo.jpg"},
  @{Name="Canon PIXMA G2430 All-in-One Printer"; File="canon-pixma-g2430-all-in-one-printer.jpg"},
  @{Name="TP-Link Archer AX55 Wi-Fi 6 Router"; File="tp-link-archer-ax55-wi-fi-6-router.jpg"},
  @{Name="Samsung 24-inch LED Monitor"; File="samsung-24-inch-led-monitor.jpg"},
  @{Name="Seagate Expansion 1TB External Hard Drive"; File="seagate-expansion-1tb-external-hard-drive.jpg"},
  @{Name="SanDisk Ultra 64GB USB 3.0 Flash Drive"; File="sandisk-ultra-64gb-usb-3-0-flash-drive.jpg"},
  @{Name="ASUS RT-AC1200G+ Wi-Fi Router"; File="asus-rt-ac1200g-plus-wi-fi-router.jpg"},
  @{Name="Epson EcoTank L3210 All-in-One Printer"; File="epson-ecotank-l3210-all-in-one-printer.jpg"},
  @{Name="Dell Wired Keyboard KB216"; File="dell-wired-keyboard-kb216.jpg"},
  @{Name="Logitech B100 Wired Mouse"; File="logitech-b100-wired-mouse.jpg"},
  @{Name="APC Back-UPS 1200VA UPS"; File="apc-back-ups-1200va-ups.jpg"},
  @{Name="D-Link DGS-108 8-Port Gigabit Switch"; File="d-link-dgs-108-8-port-gigabit-switch.jpg"},
  @{Name="HP LaserJet Pro MFP M28a Printer"; File="hp-laserjet-pro-mfp-m28a-printer.jpg"},
  @{Name="Brother HL-L2350DW Laser Printer"; File="brother-hl-l2350dw-laser-printer.jpg"},
  @{Name="Tenda 4G03 Pro 4G LTE Wi-Fi Router"; File="tenda-4g03-pro-4g-lte-wi-fi-router.jpg"},
  @{Name="Kingston 480GB SSD"; File="kingston-480gb-ssd.jpg"},
  @{Name="Corsair HS50 Gaming Headset"; File="corsair-hs50-gaming-headset.jpg"},
  @{Name="Fantech K513 Gaming Keyboard"; File="fantech-k513-gaming-keyboard.jpg"},
  @{Name="Ubiquiti UniFi U6-Lite Wi-Fi 6 Access Point"; File="ubiquiti-unifi-u6-lite-wi-fi-6-access-point.jpg"},
  @{Name="HP 27f 27-inch IPS Monitor"; File="hp-27f-27-inch-ips-monitor.jpg"},
  @{Name="Western Digital 2TB External Hard Drive"; File="western-digital-2tb-external-hard-drive.jpg"},
  @{Name="TP-Link TL-SG108E Smart Switch 8-Port"; File="tp-link-tl-sg108e-smart-switch-8-port.jpg"},
  @{Name="ASUS USB-AC53 Dual-Band Wi-Fi Adapter"; File="asus-usb-ac53-dual-band-wi-fi-adapter.jpg"},
  @{Name="Microsoft LifeCam HD-3000 Webcam"; File="microsoft-lifecam-hd-3000-webcam.jpg"},
  @{Name="Hikvision 2MP IP Camera"; File="hikvision-2mp-ip-camera.jpg"},
  @{Name="Razer DeathAdder V2 Gaming Mouse"; File="razer-deathadder-v2-gaming-mouse.jpg"},
  @{Name="JBL Flip 6 Portable Bluetooth Speaker"; File="jbl-flip-6-portable-bluetooth-speaker.jpg"},
  @{Name="PowerColor Radeon RX 6600 Graphics Card"; File="powercolor-radeon-rx-6600-graphics-card.jpg"},
  @{Name="Intel Core i5-12400 Desktop Processor"; File="intel-core-i5-12400-desktop-processor.jpg"},
  @{Name="Thermaltake Versa H18 PC Case"; File="thermaltake-versa-h18-pc-case.jpg"}
)

function Get-DuckImageResults($query) {
  $q = [uri]::EscapeDataString($query)
  $searchUrl = "https://duckduckgo.com/?q=$q&iar=images&iax=images&ia=images"
  $html = (Invoke-WebRequest -Uri $searchUrl -Headers @{"User-Agent"=$ua} -UseBasicParsing -TimeoutSec 30).Content
  $vqd = [regex]::Match($html, 'vqd="([^"]+)').Groups[1].Value
  if (-not $vqd) {
    throw "Could not get image search token."
  }
  $apiUrl = "https://duckduckgo.com/i.js?l=us-en&o=json&q=$q&vqd=$vqd&f=,,,&p=1"
  (Invoke-RestMethod -Uri $apiUrl -Headers @{referer=$searchUrl; "User-Agent"=$ua; Accept="application/json, text/javascript, */*; q=0.01"} -UseBasicParsing -TimeoutSec 30).results
}

function Save-AsJpeg($source, $target) {
  $img = [System.Drawing.Image]::FromFile($source)
  try {
    if ($img.Width -lt 260 -or $img.Height -lt 180) {
      throw "Image is too small: $($img.Width)x$($img.Height)."
    }
    $bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
      $quality = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 92L
      $params = New-Object System.Drawing.Imaging.EncoderParameters 1
      $params.Param[0] = $quality
      $bmp.Save($target, $codec, $params)
    } finally {
      if ($graphics) { $graphics.Dispose() }
      if ($bmp) { $bmp.Dispose() }
    }
  } finally {
    $img.Dispose()
  }
}

$usedHashes = @{}
$results = foreach ($product in $products) {
  $target = Join-Path $dir $product.File
  $queries = @(
    "$($product.Name) official product image white background",
    "$($product.Name) product image white background",
    "$($product.Name) product render"
  )
  $saved = $false
  $lastError = ""
  foreach ($query in $queries) {
    if ($saved) { break }
    try {
      $candidates = Get-DuckImageResults $query | Where-Object {
        $_.image -and $_.width -ge 300 -and $_.height -ge 220 -and $_.image -notmatch "loremflickr|unsplash|picsum|placeholder|wikimedia"
      } | Select-Object -First 16
      foreach ($candidate in $candidates) {
        $temp = Join-Path $env:TEMP ("ict-product-image-" + [guid]::NewGuid().ToString() + ".img")
        try {
          Invoke-WebRequest -Uri $candidate.image -OutFile $temp -Headers @{
            "User-Agent" = $ua
            Accept = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
          } -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 45 -ErrorAction Stop
          Save-AsJpeg $temp $target
          $file = Get-Item $target
          if ($file.Length -lt 10000) {
            throw "Saved JPEG is too small ($($file.Length) bytes)."
          }
          $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
          if ($usedHashes.ContainsKey($hash)) {
            throw "Duplicate image hash already used by $($usedHashes[$hash])."
          }
          $usedHashes[$hash] = $product.File
          $saved = $true
          [pscustomobject]@{Product=$product.Name; File=$product.File; Status="ok"; KB=[math]::Round($file.Length/1KB,1); Source=$candidate.image}
          break
        } catch {
          $lastError = $_.Exception.Message
        } finally {
          Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
        }
      }
    } catch {
      $lastError = $_.Exception.Message
    }
  }
  if (-not $saved) {
    [pscustomobject]@{Product=$product.Name; File=$product.File; Status=$lastError; KB=0; Source=""}
  }
}

$results | Tee-Object -FilePath "web/public/images/products/ict-download-results.txt" | Format-Table Product,File,Status,KB -AutoSize
if ($results | Where-Object { $_.Status -ne "ok" }) {
  exit 1
}
