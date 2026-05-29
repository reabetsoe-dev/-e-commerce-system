$items = @(
  @{N=1; Provider='Hostinger'; Plan='Premium Web Hosting'; Slug='hostinger-premium-web-hosting'; Color='#6747D8'; Accent='#2F206D'},
  @{N=2; Provider='Bluehost'; Plan='Basic Hosting'; Slug='bluehost-basic-hosting'; Color='#196BDE'; Accent='#0E3A78'},
  @{N=3; Provider='SiteGround'; Plan='StartUp Hosting'; Slug='siteground-startup-hosting'; Color='#69B237'; Accent='#355F1D'},
  @{N=4; Provider='A2 Hosting'; Plan='Startup Hosting'; Slug='a2-hosting-startup-hosting'; Color='#55A630'; Accent='#1E4E1A'},
  @{N=5; Provider='InMotion Hosting'; Plan='Launch Hosting'; Slug='inmotion-hosting-launch-hosting'; Color='#D92C2C'; Accent='#641414'},
  @{N=6; Provider='DreamHost'; Plan='Shared Starter'; Slug='dreamhost-shared-starter'; Color='#1976D2'; Accent='#0A3763'},
  @{N=7; Provider='Namecheap'; Plan='Stellar Hosting'; Slug='namecheap-stellar-hosting'; Color='#F36C21'; Accent='#71310F'},
  @{N=8; Provider='GoDaddy'; Plan='Economy Hosting'; Slug='godaddy-economy-hosting'; Color='#111111'; Accent='#2FA866'},
  @{N=9; Provider='HostGator'; Plan='Hatchling Plan'; Slug='hostgator-hatchling-plan'; Color='#1F75FE'; Accent='#F6B400'},
  @{N=10; Provider='GreenGeeks'; Plan='Lite Hosting'; Slug='greengeeks-lite-hosting'; Color='#28A745'; Accent='#125523'},
  @{N=11; Provider='HostPapa'; Plan='Starter Hosting'; Slug='hostpapa-starter-hosting'; Color='#76A82A'; Accent='#3F5F12'},
  @{N=12; Provider='ScalaHosting'; Plan='Start Hosting'; Slug='scalahosting-start-hosting'; Color='#6DBD2A'; Accent='#2C5D10'},
  @{N=13; Provider='Kamatera'; Plan='Basic Cloud Hosting'; Slug='kamatera-basic-cloud-hosting'; Color='#3B82F6'; Accent='#163A72'},
  @{N=14; Provider='AccuWeb Hosting'; Plan='Basic Plan'; Slug='accuweb-hosting-basic-plan'; Color='#0A84D6'; Accent='#073C66'},
  @{N=15; Provider='MilesWeb'; Plan='Starter Hosting'; Slug='milesweb-starter-hosting'; Color='#1463D9'; Accent='#081F54'},
  @{N=16; Provider='InterServer'; Plan='Standard Web Hosting'; Slug='interserver-standard-web-hosting'; Color='#3B8FD9'; Accent='#1E4D74'},
  @{N=17; Provider='FastComet'; Plan='FastCloud Basic'; Slug='fastcomet-fastcloud-basic'; Color='#FFCC2F'; Accent='#6E5410'},
  @{N=18; Provider='StableHost'; Plan='Starter Plan'; Slug='stablehost-starter-plan'; Color='#2EAD4B'; Accent='#145723'},
  @{N=19; Provider='Liquid Web'; Plan='Spark Plan'; Slug='liquid-web-spark-plan'; Color='#68BFEA'; Accent='#23566F'},
  @{N=20; Provider='Verpex'; Plan='Start Hosting'; Slug='verpex-start-hosting'; Color='#5B5FF0'; Accent='#24276F'}
)

Add-Type -AssemblyName System.Drawing
$outDir = Resolve-Path 'web/public/images/products'
function ColorFromHex($hex) { return [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Draw-RoundedRect($g, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, $r, $r, 180, 90)
  $path.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
  $path.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
  $path.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}
function Draw-TextCenter($g, $text, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h) {
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($text, $font, $brush, (New-Object System.Drawing.RectangleF($x,$y,$w,$h)), $fmt)
  $fmt.Dispose()
}

foreach ($item in $items) {
  $bmp = New-Object System.Drawing.Bitmap 900, 600
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::White)

  $primary = ColorFromHex $item.Color
  $accent = ColorFromHex $item.Accent
  $light = [System.Drawing.Color]::FromArgb(246, 248, 252)
  $muted = [System.Drawing.Color]::FromArgb(105, 113, 124)
  $line = [System.Drawing.Color]::FromArgb(222, 228, 236)

  $titleFont = New-Object System.Drawing.Font('Arial', 27, [System.Drawing.FontStyle]::Bold)
  $brandFont = New-Object System.Drawing.Font('Arial', 40, [System.Drawing.FontStyle]::Bold)
  $smallFont = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Regular)
  $tinyFont = New-Object System.Drawing.Font('Arial', 13, [System.Drawing.FontStyle]::Regular)
  $boldSmall = New-Object System.Drawing.Font('Arial', 15, [System.Drawing.FontStyle]::Bold)

  Draw-TextCenter $g ("$($item.N). $($item.Provider)`n$($item.Plan)") $titleFont ([System.Drawing.Brushes]::Black) 20 15 860 78

  $markBrush = New-Object System.Drawing.SolidBrush($primary)
  $accentBrush = New-Object System.Drawing.SolidBrush($accent)
  $lightBrush = New-Object System.Drawing.SolidBrush($light)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $linePen = New-Object System.Drawing.Pen($line, 2)
  $primaryPen = New-Object System.Drawing.Pen($primary, 4)

  $logoX = 80; $logoY = 118
  $g.FillEllipse($markBrush, $logoX, $logoY + 4, 54, 54)
  $initial = $item.Provider.Substring(0,1).ToUpper()
  $initFont = New-Object System.Drawing.Font('Arial', 30, [System.Drawing.FontStyle]::Bold)
  Draw-TextCenter $g $initial $initFont $whiteBrush $logoX ($logoY + 1) 54 54
  $g.DrawString($item.Provider, $brandFont, $accentBrush, 150, 112)

  for ($s=0; $s -lt 4; $s++) {
    $sx = 72 + ($s * 28); $sy = 285 - ($s * 28)
    Draw-RoundedRect $g $accentBrush $sx $sy 178 58 12
    $g.FillRectangle($markBrush, $sx + 14, $sy + 13, 8, 32)
    $g.FillEllipse($whiteBrush, $sx + 139, $sy + 21, 12, 12)
    $g.FillEllipse($whiteBrush, $sx + 158, $sy + 21, 12, 12)
    $g.DrawLine($primaryPen, $sx + 36, $sy + 30, $sx + 112, $sy + 30)
  }

  Draw-RoundedRect $g $lightBrush 322 218 498 285 22
  $g.DrawRectangle($linePen, 342, 238, 458, 245)
  Draw-RoundedRect $g $whiteBrush 352 252 428 215 18
  $g.DrawString('Dashboard', $boldSmall, $accentBrush, 378, 276)
  $g.DrawString('Website', $tinyFont, $mutedBrush, 378, 318)
  $g.DrawString('example.com', $boldSmall, [System.Drawing.Brushes]::Black, 378, 344)
  $g.DrawString('Plan', $tinyFont, $mutedBrush, 378, 386)
  $g.DrawString($item.Plan, $boldSmall, [System.Drawing.Brushes]::Black, 378, 412)
  Draw-RoundedRect $g $markBrush 640 316 102 42 18
  Draw-TextCenter $g 'Manage' $tinyFont $whiteBrush 640 318 102 38

  $metrics = @('Storage','Bandwidth','SSL')
  for ($m=0; $m -lt 3; $m++) {
    $mx = 378 + ($m * 120); $my = 455
    $g.DrawString($metrics[$m], $tinyFont, $mutedBrush, $mx, $my)
    $g.FillRectangle($linePen.Brush, $mx, $my + 24, 80, 8)
    $g.FillRectangle($markBrush, $mx, $my + 24, 42 + ($m * 12), 8)
  }

  $g.DrawLine($linePen, 0, 598, 900, 598)
  $g.Dispose()
  $bmp.Save((Join-Path $outDir ("$($item.Slug).jpg")), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $bmp.Dispose()

  $titleFont.Dispose(); $brandFont.Dispose(); $smallFont.Dispose(); $tinyFont.Dispose(); $boldSmall.Dispose(); $initFont.Dispose()
  $markBrush.Dispose(); $accentBrush.Dispose(); $lightBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose(); $linePen.Dispose(); $primaryPen.Dispose()
}
Get-ChildItem $outDir -Filter '*hosting*.jpg' | Select-Object Name,Length | Sort-Object Name