-- Clear existing data (safe for dev resets)
TRUNCATE triage_results, bookings, slots, doctors, hospitals, users
  RESTART IDENTITY CASCADE;

-- ==========================================
-- 1. SEED PATIENT USERS
-- ==========================================
-- Password for all: "password123" (bcrypt hash)
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Akash Sharma', 'patient@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'patient', '+91-9876543210'),
('Priya Singh', 'priya@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'patient', '+91-9876543211');

-- ==========================================
-- 2. SEED HOSPITALS (Delhi NCR coordinates)
-- ==========================================
INSERT INTO hospitals (
  name, address, phone, location, specialties, 
  wait_time_minutes, available_beds, total_beds, rating,
  about, image_url, contact_email, gallery_image_1, gallery_image_2
) VALUES
(
  'AIIMS Delhi',
  'Ansari Nagar East, New Delhi - 110029',
  '+91-11-26588500',
  ST_MakePoint(77.2167, 28.5672)::geography,
  ARRAY['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
  12, 45, 200, 4.8,
  'All India Institute of Medical Sciences Delhi is a premier public medical research university and hospital based in New Delhi. Established in 1956, it operates autonomously under the Ministry of Health and Family Welfare.',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'contact.aiims@qcare.in',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800'
),
(
  'Safdarjung Hospital',
  'Ansari Nagar West, New Delhi - 110029',
  '+91-11-26165060',
  ST_MakePoint(77.2010, 28.5685)::geography,
  ARRAY['Emergency', 'General Practice', 'Gynecology', 'Diagnostics'],
  35, 20, 150, 4.2,
  'Safdarjung Hospital is a multi-specialty hospital and one of the largest government hospitals in India, located in the heart of New Delhi. It is known for its excellent emergency and trauma services.',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'admin.sfj@qcare.in',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
),
(
  'Sir Ganga Ram Hospital',
  'Rajinder Nagar, New Delhi - 110060',
  '+91-11-25750000',
  ST_MakePoint(77.1855, 28.6412)::geography,
  ARRAY['Cardiology', 'Orthopedics', 'Neurology', 'Diagnostics'],
  8, 30, 120, 4.7,
  'Sir Ganga Ram Hospital is a 675-bed multi-speciality state-of-the-art hospital in New Delhi. It provides comprehensive healthcare services and is widely acclaimed for its clinical excellence.',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'info.sgrh@qcare.in',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800'
),
(
  'Fortis Hospital Gurugram',
  'Sector 44, Gurugram, Haryana - 122002',
  '+91-124-4921021',
  ST_MakePoint(77.0266, 28.4595)::geography,
  ARRAY['Cardiology', 'Orthopedics', 'Emergency', 'Pediatrics'],
  55, 5, 80, 4.5,
  'Fortis Memorial Research Institute is a multi-speciality, quaternary care hospital in Gurugram, with an international faculty and state-of-the-art infrastructure.',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'contact.gurugram@fortis.in',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
),
(
  'Max Super Speciality Saket',
  'Press Enclave Road, Saket, New Delhi - 110017',
  '+91-11-26515050',
  ST_MakePoint(77.2167, 28.5244)::geography,
  ARRAY['Cardiology', 'Neurology', 'Gynecology', 'Diagnostics'],
  20, 18, 100, 4.6,
  'Max Super Speciality Hospital in Saket is one of the premier healthcare facilities in North India, offering multi-disciplinary patient care and advanced medical technologies.',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'saket.admin@maxhealthcare.com',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800'
),
(
  'Apollo Hospital Jasola',
  'Mathura Road, Jasola, New Delhi - 110025',
  '+91-11-71791090',
  ST_MakePoint(77.2833, 28.5456)::geography,
  ARRAY['Emergency', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology'],
  15, 25, 110, 4.7,
  'Indraprastha Apollo Hospitals is a renowned multi-specialty tertiary acute care hospital, equipped with state-of-the-art diagnostic and therapeutic facilities.',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'corporate.apollo@apollohospitals.com',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
),
(
  'Lok Nayak Hospital',
  'Jawaharlal Nehru Marg, New Delhi - 110002',
  '+91-11-23232400',
  ST_MakePoint(77.2411, 28.6358)::geography,
  ARRAY['Emergency', 'General Practice', 'Diagnostics', 'Gynecology'],
  45, 10, 180, 3.9,
  'Lok Nayak Hospital, formerly known as Irwin Hospital, is a key public healthcare institution in Delhi, dedicated to offering affordable tertiary care to the community.',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'lnh.admin@delhi.gov.in',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800'
),
(
  'BLK Super Speciality Hospital',
  'Pusa Road, New Delhi - 110005',
  '+91-11-30403040',
  ST_MakePoint(77.1654, 28.6445)::geography,
  ARRAY['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
  18, 22, 95, 4.5,
  'BLK-Max Super Speciality Hospital is one of the largest private sector tertiary care hospitals in Delhi, featuring advanced critical care and specialized medical programs.',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'blk.helpdesk@blkmax.in',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
),
(
  'Medanta - The Medicity',
  'CH Baktawar Singh Road, Sector 38, Gurugram, Haryana - 122001',
  '+91-124-4141414',
  ST_MakePoint(77.0398, 28.4253)::geography,
  ARRAY['Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Practice'],
  25, 50, 350, 4.8,
  'Medanta is one of India''s largest multi-super specialty medical institutes, integrating outstanding clinical care, state-of-the-art technology, and research facilities.',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'contact@medanta.org',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800'
),
(
  'Max Super Speciality Hospital Patparganj',
  '108A, I.P. Extension, Patparganj, Delhi - 110092',
  '+91-11-43033333',
  ST_MakePoint(77.3045, 28.6304)::geography,
  ARRAY['Emergency', 'Cardiology', 'Gynecology', 'Diagnostics', 'Pediatrics'],
  15, 15, 120, 4.5,
  'Max Super Speciality Hospital, Patparganj is a leading healthcare facility offering high-end medical care in East Delhi, known for its excellence in maternal and cardiac health.',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
  'info.ppg@maxhealthcare.com',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
),
(
  'Holy Family Hospital Okhla',
  'Okhla Road, Okhla, New Delhi - 110025',
  '+91-11-26845900',
  ST_MakePoint(77.2741, 28.5615)::geography,
  ARRAY['Emergency', 'General Practice', 'Pediatrics', 'Gynecology', 'Diagnostics'],
  30, 25, 200, 4.3,
  'Holy Family Hospital is a premier registered charitable trust hospital that provides high-quality, compassionate healthcare services to all sections of society.',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'office@holyfamilyhospital.delhi',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
),
(
  'Fortis Flt. Lt. Rajan Dhall Hospital Vasant Kunj',
  'Sector B, Pocket 1, Vasant Kunj, New Delhi - 110070',
  '+91-11-42776222',
  ST_MakePoint(77.1593, 28.5284)::geography,
  ARRAY['Cardiology', 'Orthopedics', 'Pediatrics', 'Diagnostics', 'Neurology'],
  20, 12, 100, 4.4,
  'Fortis Flt. Lt. Rajan Dhall Hospital in Vasant Vihar / Vasant Kunj is a multi-specialty hospital committed to providing quality clinical care in South Delhi.',
  'https://images.unsplash.com/photo-1586773860418-d3b3de97e663?auto=format&fit=crop&q=80&w=800',
  'corporate.vk@fortishealthcare.com',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800'
);

-- ==========================================
-- 3. SEED ADMIN USERS
-- ==========================================
-- Password for all: "password123" (bcrypt hash)
INSERT INTO users (name, email, password_hash, role, phone, hospital_id) VALUES
('AIIMS Admin', 'admin.aiims@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-26588500', 1),
('Safdarjung Admin', 'admin.safdarjung@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-26165060', 2),
('Ganga Ram Admin', 'admin.ganagram@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-25750000', 3),
('Fortis Gurugram Admin', 'admin.fortis@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-124-4921021', 4),
('Max Saket Admin', 'admin.maxsaket@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-26515050', 5),
('Apollo Admin', 'admin.apollo@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-71791090', 6),
('Lok Nayak Admin', 'admin.loknayak@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-23232400', 7),
('BLK Admin', 'admin.blk@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-30403040', 8),
('Medanta Admin', 'admin.medanta@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-124-4141414', 9),
('Max Patparganj Admin', 'admin.maxpatparganj@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-43033333', 10),
('Holy Family Admin', 'admin.holyfamily@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-26845900', 11),
('Fortis VK Admin', 'admin.fortisvk@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-42776222', 12);

-- Also support default general admin login for AIIMS Delhi (hospital_id = 1)
INSERT INTO users (name, email, password_hash, role, phone, hospital_id)
VALUES ('General Admin', 'admin@qcare.in', '$2b$10$94IX7dU8AeisEF1V3hF9IuwGOgC5tbGLmUBO6CCQ0hPMlTRtSjpmq', 'hospital_admin', '+91-11-26588500', 1);

-- ==========================================
-- 4. SEED DOCTORS
-- ==========================================
INSERT INTO doctors (hospital_id, name, specialty, qualification, experience, consultation_fee, working_hours, available) VALUES
-- AIIMS Delhi (id: 1)
(1, 'Dr. Rajesh Kumar', 'Cardiology', 'MD, DM (Cardiology)', 15, 800, '09:00-15:00', TRUE),
(1, 'Dr. Sunita Sharma', 'Neurology', 'MD, DM (Neurology)', 12, 900, '10:00-16:00', TRUE),
(1, 'Dr. Anil Gupta', 'Orthopedics', 'MS, MCh (Ortho)', 18, 750, '09:00-13:00', TRUE),

-- Safdarjung Hospital (id: 2)
(2, 'Dr. Ramesh Chandra', 'Emergency', 'MD (Medicine)', 8, 500, '08:00-16:00', TRUE),
(2, 'Dr. Suman Rao', 'General Practice', 'MBBS', 10, 400, '09:00-17:00', TRUE),
(2, 'Dr. Kavita Reddy', 'Gynecology', 'MS (OBG)', 11, 600, '10:00-16:00', TRUE),

-- Sir Ganga Ram (id: 3)
(3, 'Dr. Meera Patel', 'Cardiology', 'MD, DNB (Cardiology)', 14, 1200, '09:00-17:00', TRUE),
(3, 'Dr. Vikram Singh', 'General Practice', 'MBBS, MD', 20, 1000, '08:00-14:00', TRUE),
(3, 'Dr. Alok Tripathi', 'Diagnostics', 'MD (Radiology)', 9, 800, '09:00-17:00', TRUE),

-- Fortis Gurugram (id: 4)
(4, 'Dr. Sandeep Vaishya', 'Neurology', 'MS, MCh (Neurology)', 22, 1500, '10:00-16:00', TRUE),
(4, 'Dr. Ashok Seth', 'Cardiology', 'MD, DM (Cardiology)', 30, 2000, '11:00-15:00', TRUE),
(4, 'Dr. IPS Oberoi', 'Orthopedics', 'MS, MCh (Ortho)', 25, 1800, '09:00-17:00', TRUE),

-- Max Saket (id: 5)
(5, 'Dr. Priya Nair', 'Gynecology', 'MD, DNB (Gynecology)', 13, 1100, '09:00-15:00', TRUE),
(5, 'Dr. Rahul Verma', 'Cardiology', 'MD, DM (Cardiology)', 16, 1300, '10:00-17:00', TRUE),
(5, 'Dr. Harit Chaturvedi', 'Diagnostics', 'MS, MCh (Surgical Oncology)', 24, 1500, '09:00-16:00', TRUE),

-- Apollo Jasola (id: 6)
(6, 'Dr. Neha Joshi', 'Pediatrics', 'MD (Pediatrics)', 10, 1000, '09:00-14:00', TRUE),
(6, 'Dr. Sanjay Mehta', 'Orthopedics', 'MS (Ortho)', 15, 1200, '14:00-18:00', TRUE),
(6, 'Dr. Anupam Sibal', 'Pediatrics', 'MD, FRCPI', 28, 1800, '10:00-16:00', TRUE),

-- Lok Nayak Hospital (id: 7)
(7, 'Dr. Rajeev Kumar', 'General Practice', 'MBBS', 7, 300, '09:00-16:00', TRUE),
(7, 'Dr. Seema Kapoor', 'Pediatrics', 'MD (Pediatrics)', 14, 400, '08:00-14:00', TRUE),

-- BLK Hospital (id: 8)
(8, 'Dr. Subhash Chandra', 'Cardiology', 'MD, DM (Cardiology)', 20, 1200, '09:00-15:00', TRUE),
(8, 'Dr. Puneet Girdhar', 'Orthopedics', 'MS, MCh (Ortho)', 16, 1100, '10:00-17:00', TRUE),

-- Medanta Gurugram (id: 9)
(9, 'Dr. Naresh Trehan', 'Cardiology', 'MBBS, MD (Cardiothoracic Surgery)', 35, 2500, '10:00-14:00', TRUE),
(9, 'Dr. Arvinder Singh Soin', 'General Practice', 'MBBS, MS, FRCS (Transplant)', 27, 2200, '09:00-16:00', TRUE),
(9, 'Dr. Yatin Mehta', 'Emergency', 'MD, FRCA (Critical Care)', 24, 1800, '08:00-18:00', TRUE),

-- Max Patparganj (id: 10)
(10, 'Dr. Sharda Jain', 'Gynecology', 'MD (Gynecology)', 18, 1000, '09:00-15:00', TRUE),
(10, 'Dr. Manoj Kumar', 'Cardiology', 'MD, DM (Cardiology)', 15, 1200, '10:00-16:00', TRUE),

-- Holy Family Hospital (id: 11)
(11, 'Dr. Donald Fernandes', 'General Practice', 'MBBS', 12, 600, '09:00-17:00', TRUE),
(11, 'Dr. Susan Thomas', 'Pediatrics', 'MD (Pediatrics)', 15, 700, '09:00-14:00', TRUE),

-- Fortis Vasant Kunj (id: 12)
(12, 'Dr. Gurinder Bedi', 'Orthopedics', 'MS, FRCS (Ortho)', 22, 1500, '09:00-17:00', TRUE),
(12, 'Dr. Upasana Saxena', 'Diagnostics', 'MD (Radiology)', 10, 1000, '09:00-16:00', TRUE);

-- ==========================================
-- 5. SEED SLOTS (Next 3 days for all doctors)
-- ==========================================
-- Generates slots at 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 14:00, 14:30, 15:00, 15:30
INSERT INTO slots (doctor_id, hospital_id, slot_date, slot_time, is_booked)
SELECT
  d.id AS doctor_id,
  d.hospital_id AS hospital_id,
  (CURRENT_DATE + day_offset) AS slot_date,
  slot_time::time AS slot_time,
  FALSE AS is_booked
FROM doctors d
CROSS JOIN generate_series(1, 3) AS day_offset
CROSS JOIN (
  VALUES 
    ('09:00'), ('09:30'), ('10:00'), ('10:30'), 
    ('11:00'), ('11:30'), ('14:00'), ('14:30'), 
    ('15:00'), ('15:30')
) AS t(slot_time)
ON CONFLICT (doctor_id, slot_date, slot_time) DO NOTHING;

-- Pre-book some slots for doctor ID 1, 7, 13, and 23 on Day 1 to allow booking testing
UPDATE slots
SET is_booked = TRUE
WHERE doctor_id IN (1, 7, 13, 23) 
  AND slot_date = CURRENT_DATE + 1 
  AND slot_time IN ('10:00'::time, '15:00'::time);
