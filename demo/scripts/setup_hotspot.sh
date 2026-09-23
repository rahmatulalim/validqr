#!/usr/bin/env bash
# macOS/Linux helper to start a dedicated WiFi hotspot for the demo.
# Ensures the Flutter app and Node backend can communicate without venue WiFi issues.

echo "📶 Setting up dedicated HackNusa Demo Hotspot..."
echo "Note: This script provides instructions/commands based on your OS."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "On macOS, please use the UI: System Settings > General > Sharing > Internet Sharing"
    echo "Share connection from: Wi-Fi/Ethernet"
    echo "To computers using: Wi-Fi"
    echo "Click 'Wi-Fi Options' to set Network Name to 'HackNusa-Demo' and set a password."
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (NetworkManager)
    if command -v nmcli &> /dev/null; then
        echo "Creating hotspot using nmcli..."
        nmcli device wifi hotspot ifname wlan0 ssid HackNusa-Demo password "nusapay2026"
    else
        echo "nmcli not found. Please setup hotspot manually."
    fi
else
    echo "Unsupported OS for automatic hotspot setup. Please create one manually."
fi

echo "✅ Once connected, update the API_BASE_URL in constants.dart to your laptop's IP address."
