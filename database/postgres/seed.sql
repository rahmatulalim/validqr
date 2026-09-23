-- Seed Demo Data for HackNusa 2026
-- Only insert the REAL merchant. The "penipu" NMID deliberately doesn't exist here.

INSERT INTO merchants (nmid, name, latitude, longitude, wa_number) 
VALUES
('ID10293847561', 'Warung Bakso Pak Budi', -6.8915, 107.6107, '6281234567890')
ON CONFLICT (nmid) DO UPDATE 
SET name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    wa_number = EXCLUDED.wa_number;

-- Note: Replace '6281234567890' with Ryan's actual WhatsApp number before the demo
-- or override it in the WA_API payload.
