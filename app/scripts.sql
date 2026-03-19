CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TẠO BẢNG USER
CREATE TABLE "user" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL, -- 1: admin, 2: farmer
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. TẠO BẢNG DEVICE
CREATE TABLE device (
    device_id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(20) DEFAULT 'manual',
    pump_status BOOLEAN DEFAULT FALSE,
    fan_status BOOLEAN DEFAULT FALSE,
    temp_min FLOAT NULL,
    temp_max FLOAT NULL,
    humid_min FLOAT NULL,
    humid_max FLOAT NULL,
    soil_min FLOAT NULL,
    soil_max FLOAT NULL,
    light_min INTEGER NULL,
    light_max INTEGER NULL,
    last_seen TIMESTAMP NULL
);

-- 3. TẠO BẢNG SENSOR_DATA
CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY,
    device_id integer REFERENCES device(device_id) ON DELETE CASCADE,
    temperature FLOAT NOT NULL,
    air_humidity FLOAT NOT NULL,
    soil_moisture FLOAT NOT NULL,
    light_intensity INTEGER NOT NULL,
    measured_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TẠO BẢNG ACTIVITY_LOGS (Cho các hành động CRUD và điều khiển)
CREATE TABLE activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES "user"(user_id) ON DELETE SET NULL,
    device_id integer REFERENCES device(device_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- 5. TẠO BẢNG OTP TOKENS
CREATE TABLE otp_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tạo Index cho cột email 
CREATE INDEX idx_otp_tokens_email ON otp_tokens(email);


-- 6. TẠO BẢNG PENDING COMMANDS
CREATE TABLE pending_commands (
    command_id BIGSERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES device(device_id) ON DELETE CASCADE,
    actuator VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL,
    issued_by UUID REFERENCES "user"(user_id) ON DELETE SET NULL,
    source VARCHAR(20) DEFAULT 'manual',
    status VARCHAR(20) DEFAULT 'pending',
    error_detail TEXT,
    issued_at TIMESTAMP DEFAULT NOW(),
    acked_at TIMESTAMP
);