#!/usr/bin/env bash
# Run scrcpy for mirroring the Android device to the projector during the demo.

echo "📱 Starting Scrcpy for HackNusa Demo..."

# Check if scrcpy is installed
if ! command -v scrcpy &> /dev/null; then
    echo "❌ scrcpy could not be found. Please install it first."
    exit 1
fi

# Run with specific settings for a smooth demo:
# - Bitrate 8M for good quality without lag
# - Max size 1080 to ensure it fits well on projector
# - Stay awake to prevent screen turning off during presentation
scrcpy --bit-rate 8M --max-size 1080 --stay-awake
