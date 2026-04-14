-- MedBridge Database Schema
-- Hawkathon 2026 | Track 3: Healthcare

-- ─── Cleanup (To resolve type mismatches) ───────────────────────────────────
-- Unset constraints and drop tables in reverse dependency order
DROP TABLE IF EXISTS abha_records CASCADE;
DROP TABLE IF EXISTS imaging_results CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Accounts Table ───────────────────────────────────────────────────────
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('patient', 'doctor')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Doctors Table ────────────────────────────────────────────────────────
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 4.5,
    experience INTEGER DEFAULT 5,
    slots TEXT[] DEFAULT '{}',
    avatar TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Patients Table ───────────────────────────────────────────────────────
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    relationship TEXT DEFAULT 'Self',
    allergies TEXT[] DEFAULT '{}',
    medications TEXT[] DEFAULT '{}',
    conditions TEXT[] DEFAULT '{}',
    past_surgeries TEXT[] DEFAULT '{}',
    abha_id TEXT,
    abha_linked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Appointments Table ───────────────────────────────────────────────────
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot TEXT NOT NULL,
    reason TEXT,
    status TEXT CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    risk_level TEXT CHECK (risk_level IN ('HIGH', 'MEDIUM', 'LOW', null)),
    risk_score DECIMAL(5,2),
    ai_summary TEXT,
    critical_flags TEXT[] DEFAULT '{}',
    checked_in BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Prescriptions Table ──────────────────────────────────────────────────
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]',
    diagnosis TEXT,
    instructions TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. Imaging Results Table ────────────────────────────────────────────────
CREATE TABLE imaging_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    image_type TEXT, -- X-Ray, MRI, CT
    region TEXT, -- Chest, Head, etc.
    abnormalities TEXT[] DEFAULT '{}',
    quality_score DECIMAL(4,2),
    confidence DECIMAL(4,2),
    findings TEXT,
    recommendations TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. ABHA Records Table ───────────────────────────────────────────────────
CREATE TABLE abha_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    record_type TEXT,
    record_date DATE DEFAULT CURRENT_DATE,
    hospital TEXT,
    summary TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for Performance ────────────────────────────────────────────────
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_patients_account ON patients(account_id);
CREATE INDEX idx_doctors_account ON doctors(account_id);

-- ─── Row Level Security (RLS) ────────────────────────────────────────────────
-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE abha_records ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Basic hackathon version: Allow public for demo ease)
CREATE POLICY "Allow All - Public Demo" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON patients FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON prescriptions FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON imaging_results FOR ALL USING (true);
CREATE POLICY "Allow All - Public Demo" ON abha_records FOR ALL USING (true);

-- ─── Seed Data ──────────────────────────────────────────────────────────────
-- Add a default doctor for testing
INSERT INTO accounts (id, email, password_hash, role) 
VALUES ('d0c70da1-d0c7-4da1-a6b1-000000000001', 'doctor@medbridge.com', 'hashed_password', 'doctor');

INSERT INTO doctors (id, account_id, name, specialty, rating, experience, available)
VALUES ('d0000000-0000-0000-0000-000000000001', 'd0c70da1-d0c7-4da1-a6b1-000000000001', 'Dr. Sarah Smith', 'General Physician', 4.9, 12, true);

-- Add a default patient for testing
INSERT INTO accounts (id, email, password_hash, role) 
VALUES ('ba71e471-ba71-4a71-a6b1-000000000002', 'patient@medbridge.com', 'hashed_password', 'patient');

INSERT INTO patients (id, account_id, name, dob, gender, relationship)
VALUES ('p0000000-0000-0000-0000-000000000002', 'ba71e471-ba71-4a71-a6b1-000000000002', 'John Doe', '1990-05-15', 'Male', 'Self');

