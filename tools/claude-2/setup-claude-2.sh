#!/bin/bash
# Creates "/Applications/Claude 2.app": a launcher that opens a second, separate Claude instance
# (own login/settings in ~/Library/Application Support/Claude-2), with a "2" badge on the icon.
set -e
CLAUDE="/Applications/Claude.app"
LAUNCHER="/Applications/Claude 2.app"
DATA="$HOME/Library/Application Support/Claude-2"
[ -d "$CLAUDE" ] || { echo "Claude.app not found in /Applications — install Claude first."; exit 1; }

mkdir -p "$DATA"
rm -rf "$LAUNCHER"
osacompile -o "$LAUNCHER" -e 'do shell script "open -n -a /Applications/Claude.app --args --user-data-dir=\"$HOME/Library/Application Support/Claude-2\""'

ICNS=$(ls "$CLAUDE"/Contents/Resources/*.icns | head -1)
TMP=$(mktemp -d)
cp "$ICNS" "$TMP/claude2.icns"

if command -v swift >/dev/null 2>&1 && swift --version >/dev/null 2>&1; then
cat > "$TMP/badge.swift" <<'SWIFT'
import AppKit
for path in CommandLine.arguments.dropFirst() {
    guard let src = NSImage(contentsOfFile: path), let r0 = src.representations.first else { continue }
    let w = r0.pixelsWide, h = r0.pixelsHigh
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8,
        samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let size = CGFloat(w)
    src.draw(in: NSRect(x: 0, y: 0, width: size, height: CGFloat(h)))
    let d = size * 0.46, m = size * 0.04
    let c = NSRect(x: size - d - m, y: m, width: d, height: d)
    NSColor.white.setFill(); NSBezierPath(ovalIn: c.insetBy(dx: -size * 0.015, dy: -size * 0.015)).fill()
    NSColor(calibratedRed: 0.85, green: 0.20, blue: 0.15, alpha: 1).setFill(); NSBezierPath(ovalIn: c).fill()
    let s = NSAttributedString(string: "2", attributes: [.font: NSFont.systemFont(ofSize: d * 0.72, weight: .heavy), .foregroundColor: NSColor.white])
    let ts = s.size()
    s.draw(at: NSPoint(x: c.midX - ts.width / 2, y: c.midY - ts.height / 2 + d * 0.02))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}
SWIFT
  iconutil -c iconset -o "$TMP/icon.iconset" "$ICNS"
  swift "$TMP/badge.swift" "$TMP"/icon.iconset/*.png
  iconutil -c icns -o "$TMP/claude2.icns" "$TMP/icon.iconset"
else
  echo "Note: Swift not available (install with: xcode-select --install) — using the plain Claude icon."
fi

cp "$TMP/claude2.icns" "$LAUNCHER/Contents/Resources/applet.icns"
codesign --force --deep -s - "$LAUNCHER" 2>/dev/null
touch "$LAUNCHER"
rm -rf "$TMP"
killall Dock 2>/dev/null || true
echo "Done: open \"Claude 2\" from Applications or Spotlight."
