-- Seed data for BAKERIST products

-- Insert sample products

-- Breads
INSERT INTO products (name, category, price, stock, description) VALUES
('Pandesal', 'breads', 2.50, 100, 'Classic Filipino bread rolls, soft and slightly sweet'),
('Ensaymada', 'breads', 25.00, 50, 'Soft, fluffy bread topped with butter, sugar, and grated cheese'),
('Spanish Bread', 'breads', 8.00, 80, 'Soft bread rolls filled with sweet butter and sugar'),
('Pan de Coco', 'breads', 10.00, 60, 'Bread filled with sweet coconut filling'),
('Cheese Bread', 'breads', 12.00, 70, 'Soft bread with cheese filling'),
('Kalihim (Pan de Regla)', 'breads', 15.00, 40, 'Soft bread with red filling'),
('Kababayan', 'breads', 8.00, 50, 'Sweet muffin-like bread, perfect for merienda')
ON CONFLICT (name) DO NOTHING;

-- Cakes
INSERT INTO products (name, category, price, stock, description, options) VALUES
('Ube Cake', 'cakes', 450.00, 10, 'Moist purple yam cake with creamy frosting', 'celebrant_name,message'),
('Sans Rival', 'cakes', 550.00, 8, 'Layered cashew meringue cake with buttercream', 'celebrant_name,message'),
('Brazo de Mercedes', 'cakes', 380.00, 12, 'Soft meringue roll with custard filling', 'celebrant_name,message'),
('Yema Cake', 'cakes', 420.00, 10, 'Soft chiffon cake with yema frosting', 'celebrant_name,message'),
('Chocolate Moist Cake', 'cakes', 400.00, 15, 'Rich and moist chocolate cake', 'celebrant_name,message'),
('Mango Float Cake', 'cakes', 480.00, 8, 'Layered cake with fresh mango and cream', 'celebrant_name,message'),
('Leche Flan Cake', 'cakes', 460.00, 10, 'Combination of soft cake and creamy leche flan', 'celebrant_name,message')
ON CONFLICT (name) DO NOTHING;

-- Cupcakes
INSERT INTO products (name, category, price, stock, description, options) VALUES
('Chocolate Cupcake', 'cupcakes', 45.00, 30, 'Rich chocolate cupcake with frosting', 'flavor'),
('Ube Cupcake', 'cupcakes', 50.00, 25, 'Purple yam flavored cupcake', 'flavor'),
('Red Velvet Cupcake', 'cupcakes', 55.00, 20, 'Classic red velvet with cream cheese frosting', 'flavor'),
('Mocha Cupcake', 'cupcakes', 50.00, 25, 'Coffee-chocolate combination cupcake', 'flavor'),
('Vanilla Cupcake', 'cupcakes', 45.00, 30, 'Classic vanilla with buttercream frosting', 'flavor'),
('Yema Cupcake', 'cupcakes', 50.00, 25, 'Sweet yema-flavored cupcake', 'flavor'),
('Cheese Cupcake', 'cupcakes', 48.00, 28, 'Cheese-topped cupcake', 'flavor'),
('Cookies and Cream Cupcake', 'cupcakes', 55.00, 20, 'Chocolate cupcake with cookies and cream frosting', 'flavor'),
('Mango Cupcake', 'cupcakes', 52.00, 22, 'Mango-flavored cupcake with mango frosting', 'flavor')
ON CONFLICT (name) DO NOTHING;

-- Other Bakery Favorites
INSERT INTO products (name, category, price, stock, description, options) VALUES
('Empanada', 'others', 25.00, 40, 'Savory pastry with various fillings', 'flavor'),
('Hopia', 'others', 15.00, 60, 'Flaky pastry with sweet fillings', 'flavor'),
('Cassava Cake', 'others', 180.00, 10, 'Traditional Filipino cassava dessert', 'size'),
('Puto', 'others', 5.00, 100, 'Steamed rice cakes', 'flavor'),
('Mamon', 'others', 12.00, 50, 'Soft and fluffy sponge cakes', 'flavor')
ON CONFLICT (name) DO NOTHING;

-- Create a default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, contact_no, barangay, sitio) 
VALUES (
    'Admin User', 
    'admin@bakerist.com', 
    '$2a$10$8K1p/a0dRTlR0d.6O2sQeO2QZJ9QZJ9QZJ9QZJ9QZJ9QZJ9QZJ9QZJ', 
    'admin', 
    '09123456789', 
    'Poblacion', 
    'Near Town Hall'
) ON CONFLICT (email) DO NOTHING;