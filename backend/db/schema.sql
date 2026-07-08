-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'hospital_admin')),
  phone VARCHAR(15),
  hospital_id INTEGER,               -- only for hospital_admin role
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(15),
  location GEOGRAPHY(POINT, 4326) NOT NULL,   -- PostGIS geography column
  specialties TEXT[] NOT NULL DEFAULT '{}',
  wait_time_minutes INTEGER NOT NULL DEFAULT 0,
  available_beds INTEGER NOT NULL DEFAULT 0,
  total_beds INTEGER NOT NULL DEFAULT 0,
  is_accepting BOOLEAN NOT NULL DEFAULT TRUE,
  rating NUMERIC(2,1) DEFAULT 4.0,
  about TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  contact_email VARCHAR(150) DEFAULT '',
  gallery_image_1 TEXT DEFAULT '',
  gallery_image_2 TEXT DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GiST spatial index — makes ST_DWithin fast
CREATE INDEX IF NOT EXISTS idx_hospitals_location
  ON hospitals USING GIST(location);

-- DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  qualification TEXT DEFAULT '',
  experience INTEGER DEFAULT 0,
  consultation_fee INTEGER DEFAULT 0,
  working_hours TEXT DEFAULT '09:00-17:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLOTS
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, slot_date, slot_time)
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  slot_id INTEGER NOT NULL REFERENCES slots(id),
  hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  idempotency_key VARCHAR(100) UNIQUE NOT NULL,   -- prevents double bookings
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for patient's booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_patient
  ON bookings(patient_id);

-- TRIAGE RESULTS
CREATE TABLE IF NOT EXISTS triage_results (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  symptoms TEXT NOT NULL,
  urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('low', 'moderate', 'urgent', 'critical')),
  emergency BOOLEAN NOT NULL DEFAULT FALSE,
  recommended_specialty VARCHAR(100),
  suggested_action TEXT,
  confidence NUMERIC(3,2),
  override BOOLEAN NOT NULL DEFAULT FALSE,   -- true if safety override was triggered
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for patient's triage history
CREATE INDEX IF NOT EXISTS idx_triage_patient
  ON triage_results(patient_id);
