-- Create database schema for BAKERIST

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    contact_no VARCHAR(20),
    barangay VARCHAR(50),
    sitio VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    available BOOLEAN DEFAULT true,
    description TEXT,
    options TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    items JSONB NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    delivery_info JSONB NOT NULL,
    tracking_status VARCHAR(20) DEFAULT 'to_pay',
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id SERIAL PRIMARY KEY,
    barangay VARCHAR(50) UNIQUE NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL
);

-- Insert default delivery zones (Barangays in Mabini, Batangas)
INSERT INTO delivery_zones (barangay, shipping_fee) VALUES
('Anilao', 50.00),
('Bagalangit', 60.00),
('Bulacan', 45.00),
('Calamias', 55.00),
('Estrella', 50.00),
('Gasang', 45.00),
('Laurel', 40.00),
('Ligaya', 50.00),
('Mainaga', 55.00),
('Mainit', 45.00),
('Majuben', 50.00),
('Malimatoc I', 40.00),
('Malimatoc II', 40.00),
('Nag-Iba', 55.00),
('Pilahan', 60.00),
('Poblacion', 30.00),
('Pulang Lupa', 50.00),
('Pulong Anahao', 55.00),
('Pulong Balibaguhan', 55.00),
('Pulong Niogan', 50.00),
('Saguing', 45.00),
('Sampaguita', 40.00),
('San Francisco', 50.00),
('San Jose', 45.00),
('San Juan', 50.00),
('San Teodoro', 55.00),
('Santa Ana', 45.00),
('Santa Mesa', 50.00),
('Santo Niño', 45.00),
('Santo Tomas', 50.00),
('Solo', 55.00),
('Talaga', 50.00),
('Talaga Proper', 50.00)
ON CONFLICT (barangay) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tracking_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);