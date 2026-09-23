#!/usr/bin/env python3
"""
Generate 3 QRIS stickers for HackNusa 2026 demo.
Each sticker uses a custom EMVCo TLV payload — no external provider needed.
"""
import qrcode
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def build_tlv(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"

def build_nmid_tag(nmid: str) -> str:
    # tag 26 (Merchant Account Info), sub-tag 01 (NMID), then sub-tag 07 (additional)
    inner = build_tlv("00", "ID.CO.QRIS.WWW") + build_tlv("01", nmid) + build_tlv("02", "93600009" + nmid) + build_tlv("03", "UMI")
    return build_tlv("26", inner)

def build_payload(nmid: str, name: str, city: str, postal: str) -> str:
    payload = (
        build_tlv("00", "01") +
        build_tlv("01", "11") +
        build_nmid_tag(nmid) +
        build_tlv("52", "5812") +
        build_tlv("53", "360") +
        build_tlv("58", "ID") +
        build_tlv("59", name) +
        build_tlv("60", city) +
        build_tlv("61", postal)
    )
    # Append tag 62 (Additional Data) with sub-tag 07 (Reference Label / NMID)
    additional_data = build_tlv("07", nmid)
    payload += build_tlv("62", additional_data)

    # Append tag 63 (CRC)
    payload_with_crc_placeholder = payload + "6304"
    crc = crc16_ccitt_false(payload_with_crc_placeholder)
    return payload_with_crc_placeholder + crc

def crc16_ccitt_false(data: str) -> str:
    crc = 0xFFFF
    for ch in data:
        crc ^= ord(ch) << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return f"{crc:04X}"

def generate_sticker(filename: str, name: str, nmid: str, city="Bandung", postal="40123"):
    payload = build_payload(nmid, name, city, postal)
    print(f"\n[{filename}]")
    print(f"  Payload: {payload}")
    print(f"  Length: {len(payload)} chars")
    
    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(payload)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    
    # Compose onto sticker template (QR + text below)
    W, H = 600, 800
    canvas = Image.new("RGB", (W, H), "white")
    qr_size = 500
    qr_resized = qr_img.resize((qr_size, qr_size))
    canvas.paste(qr_resized, ((W - qr_size) // 2, 40))
    
    draw = ImageDraw.Draw(canvas)
    try:
        font_big = ImageFont.truetype("arial.ttf", 28)
        font_small = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font_big = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    draw.text((W // 2, 570), name, fill="black", anchor="mm", font=font_big)
    draw.text((W // 2, 620), f"NMID: {nmid}", fill="black", anchor="mm", font=font_small)
    draw.text((W // 2, 650), f"{city} - {postal}", fill="black", anchor="mm", font=font_small)
    draw.text((W // 2, 720), "SCAN UNTUK BAYAR", fill="gray", anchor="mm", font=font_small)
    
    out = Path(__file__).parent.parent / "qr_props" / filename
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "PNG")
    print(f"  Saved: {out}")

if __name__ == "__main__":
    # Sticker A — Asli (VERIFIED)
    generate_sticker("stiker_a_asli.png", "Warung Bakso Pak Budi", "ID10293847561")
    # Sticker B — Penipu (HARD_BLOCK via NMID mismatch)
    generate_sticker("stiker_b_penipu.png", "Toko Aksesoris Penipu", "ID99999999980")
    # Sticker C — Rebrand (SOFT_WARNING via fuzzy match)
    generate_sticker("stiker_c_rebrand.png", "Bakso Budi Dipatiukur", "ID10293847561")
