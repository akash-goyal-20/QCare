-- Insert hospital admin for AIIMS Delhi (hospital_id = 1)
-- Password: password123
-- Upsert so it doesn't fail if already exists
INSERT INTO users (name, email, password_hash, role, phone, hospital_id)
VALUES (
  'AIIMS Admin',
  'admin@qcare.in',
  '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq',
  'hospital_admin',
  '+91-11-26588500',
  1
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      hospital_id = EXCLUDED.hospital_id;
