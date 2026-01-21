#!/bin/bash
# Generate app icons for all platforms from a source PNG

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/build"
SOURCE_IMAGE="$PROJECT_DIR/public/assets/sprites/player/vibe-coder-idle.png"

# Create build directory
mkdir -p "$BUILD_DIR"

echo "Generating app icons..."

# Extract first frame from sprite sheet (assuming 64x64 frames)
# The sprite is likely a sheet, so we crop the first frame
sips -c 64 64 "$SOURCE_IMAGE" --out "$BUILD_DIR/icon-source.png" 2>/dev/null || cp "$SOURCE_IMAGE" "$BUILD_DIR/icon-source.png"

# Create iconset directory for macOS
ICONSET_DIR="$BUILD_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required sizes for macOS icns
# macOS requires these specific sizes
for size in 16 32 64 128 256 512; do
  sips -z $size $size "$BUILD_DIR/icon-source.png" --out "$ICONSET_DIR/icon_${size}x${size}.png" 2>/dev/null
  # Retina versions
  retina=$((size * 2))
  if [ $retina -le 1024 ]; then
    sips -z $retina $retina "$BUILD_DIR/icon-source.png" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" 2>/dev/null
  fi
done

# Generate icns file for macOS
iconutil -c icns "$ICONSET_DIR" -o "$BUILD_DIR/icon.icns" 2>/dev/null && echo "Created icon.icns" || echo "Failed to create icns"

# Copy 256x256 as the main PNG for Linux
cp "$ICONSET_DIR/icon_256x256.png" "$BUILD_DIR/icon.png" 2>/dev/null && echo "Created icon.png"

# For Windows .ico, we need a different approach
# electron-builder can use PNG and convert automatically
# But if we have imagemagick, we can create a proper .ico
if command -v convert &> /dev/null; then
  convert "$ICONSET_DIR/icon_256x256.png" "$ICONSET_DIR/icon_64x64.png" "$ICONSET_DIR/icon_32x32.png" "$ICONSET_DIR/icon_16x16.png" "$BUILD_DIR/icon.ico"
  echo "Created icon.ico"
else
  # electron-builder will handle ico generation from png
  echo "ImageMagick not found, electron-builder will generate .ico from .png"
fi

# Cleanup
rm -rf "$ICONSET_DIR"
rm -f "$BUILD_DIR/icon-source.png"

echo "Icon generation complete!"
echo "Icons in: $BUILD_DIR/"
ls -la "$BUILD_DIR/"
