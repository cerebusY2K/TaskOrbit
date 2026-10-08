#!/bin/zsh
# Builds TaskOrb.app for Apple Silicon and Intel Macs and packs it into desktop/dist/TaskOrb.dmg.
# TASKORB_URL=https://taskorb.app zsh desktop/build-dmg.sh   to point the app at another address.
set -euo pipefail
setopt null_glob
cd "${0:A:h}"

build=build
app="$build/TaskOrb.app"
version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" Info.plist)

rm -rf "$build/TaskOrb.app" "$build/stage" "$build"/TaskOrb-*
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources" dist

for arch in arm64 x86_64; do
  xcrun swiftc -O -target "$arch-apple-macos13.0" TaskOrb.swift -o "$build/TaskOrb-$arch"
done
lipo -create "$build/TaskOrb-arm64" "$build/TaskOrb-x86_64" -output "$app/Contents/MacOS/TaskOrb"

cp Info.plist "$app/Contents/Info.plist"
cp AppIcon.icns "$app/Contents/Resources/AppIcon.icns"
if [[ -n "${TASKORB_URL:-}" ]]; then
  /usr/libexec/PlistBuddy -c "Set :TaskOrbURL $TASKORB_URL" "$app/Contents/Info.plist"
fi

codesign --force --deep --sign - --options runtime "$app"

mkdir -p "$build/stage"
cp -R "$app" "$build/stage/"
ln -s /Applications "$build/stage/Applications"
rm -f "dist/TaskOrb-$version.dmg"
hdiutil create -quiet -volname "TaskOrb" -srcfolder "$build/stage" -fs HFS+ -format UDZO "dist/TaskOrb-$version.dmg"
echo "Built desktop/dist/TaskOrb-$version.dmg"
