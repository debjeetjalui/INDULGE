-- INDULGE Complete Database Schema
-- Unified database for the main INDULGE website and 3D Garment Visualizer
-- Fabrics table is shared between both systems

-- Create database
CREATE DATABASE IF NOT EXISTS indulge_db;
USE indulge_db;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table for storing user accounts
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Fabric Categories table
CREATE TABLE IF NOT EXISTS fabric_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- UNIFIED Fabrics table - serves BOTH main website AND 3D visualizer
CREATE TABLE IF NOT EXISTS fabrics (
    fabric_id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Info (shared)
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    
    -- Website Properties
    composition VARCHAR(200),
    weight VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INT DEFAULT 0,
    
    -- Image/Texture URLs (used by both website and 3D visualizer)
    image_url VARCHAR(255),              -- Main display image for website
    texture_url VARCHAR(500),            -- Texture for 3D model
    normal_map_url VARCHAR(500),         -- Normal map for 3D realism
    roughness_map_url VARCHAR(500),      -- Roughness map for 3D materials
    
    -- 3D Visualization Properties
    scale_x FLOAT DEFAULT 1.0,
    scale_y FLOAT DEFAULT 1.0,
    color_hex VARCHAR(7),
    
    -- Status Flags
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_uploaded BOOLEAN DEFAULT FALSE,   -- TRUE if user uploaded this fabric
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES fabric_categories(category_id) ON DELETE SET NULL
);

-- Product Types (Shirt, Suit, Blazer, Trousers, etc.)
CREATE TABLE IF NOT EXISTS product_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Customization Options table
CREATE TABLE IF NOT EXISTS customization_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- collar, cuff, pocket, button, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    additional_cost DECIMAL(10, 2) DEFAULT 0
);

-- Bookings table for home measurement appointments
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(50) NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'in_production', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    billing_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    fabric_id INT,
    product_type_id INT,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    customization_details JSON,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(fabric_id),
    FOREIGN KEY (product_type_id) REFERENCES product_types(type_id)
);

-- Shopping Cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    fabric_id INT,
    product_type_id INT,
    quantity INT DEFAULT 1,
    customization_details JSON,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(fabric_id),
    FOREIGN KEY (product_type_id) REFERENCES product_types(type_id)
);

-- Tracking table for order status updates
CREATE TABLE IF NOT EXISTS order_tracking (
    tracking_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    status ENUM('order_placed', 'payment_confirmed', 'measurement_scheduled', 'measurements_taken', 'design_approved', 'production_started', 'quality_check', 'packaging', 'shipped', 'out_for_delivery', 'delivered') NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Measurements table for storing user measurements
CREATE TABLE IF NOT EXISTS measurements (
    measurement_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    neck_circumference DECIMAL(5,2),
    chest_circumference DECIMAL(5,2),
    waist_circumference DECIMAL(5,2),
    hip_circumference DECIMAL(5,2),
    shoulder_width DECIMAL(5,2),
    sleeve_length DECIMAL(5,2),
    armhole_depth DECIMAL(5,2),
    torso_length DECIMAL(5,2),
    inseam_length DECIMAL(5,2),
    thigh_circumference DECIMAL(5,2),
    knee_circumference DECIMAL(5,2),
    ankle_circumference DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Payment Methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    card_number VARCHAR(20),
    card_type VARCHAR(20),
    expiry_month INT,
    expiry_year INT,
    cardholder_name VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Coupons/Discounts table
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT,
    order_id INT,
    user_id INT,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================
-- 3D GARMENT VISUALIZER TABLES
-- ============================================

-- Garments table: stores 3D model metadata and file URLs
CREATE TABLE IF NOT EXISTS garments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('shirt', 'suit', 'tshirt', 'jacket', 'trousers') NOT NULL,
    description TEXT,
    model_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User configurations: saved fabric-garment combinations for 3D visualizer
CREATE TABLE IF NOT EXISTS user_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id INT,
    garment_id INT,
    fabric_id INT,               -- References unified fabrics table
    fabric_scale FLOAT DEFAULT 1.0,
    notes TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (garment_id) REFERENCES garments(id) ON DELETE SET NULL,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(fabric_id) ON DELETE SET NULL,
    INDEX idx_session (session_id)
);

-- ============================================
-- SAMPLE DATA - FABRIC CATEGORIES
-- ============================================

INSERT INTO fabric_categories (name, description) VALUES
('Cotton', 'Premium cotton fabrics for shirts and casual wear'),
('Wool', 'Premium wool fabrics for suits and outerwear'),
('Linen', 'Breathable linen fabrics for summer wear'),
('Silk', 'Luxurious silk fabrics for formal wear'),
('Cashmere', 'Ultra-soft cashmere for premium garments')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- SAMPLE DATA - UNIFIED FABRICS (Website + 3D)
-- ============================================

INSERT INTO fabrics (name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available, is_active) VALUES
-- Egyptian Cotton (Cotton category - id 1)
('Egyptian Cotton', 'Luxurious Egyptian cotton known for its exceptional softness, durability, and breathability. Perfect for premium dress shirts.', 
 1, '100% Egyptian Cotton', '120 GSM', 2500.00, 100, 
 '/Photos/Egyptian Cotton.png', '/Photos/Egyptian Cotton.png', '#F5F5DC', TRUE, TRUE),

-- Italian Merino Wool (Wool category - id 2)
('Italian Merino Wool', 'Ultra-fine Italian Merino wool providing exceptional warmth without bulk. Ideal for bespoke suits and blazers.',
 2, '100% Italian Merino Wool', '250 GSM', 4500.00, 75,
 '/Photos/Italian Merino Wool.png', '/Photos/Italian Merino Wool.png', '#2C3E50', TRUE, TRUE),

-- Belgian Linen (Linen category - id 3)
('Belgian Linen', 'Premium Belgian linen with natural texture and exceptional breathability. Perfect for summer suits and casual elegance.',
 3, '100% Belgian Linen', '180 GSM', 3200.00, 60,
 '/Photos/Belgian Linen.png', '/Photos/Belgian Linen.png', '#D4C4A8', TRUE, TRUE)
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    price = VALUES(price);

-- ============================================
-- SAMPLE DATA - PRODUCT TYPES
-- ============================================

INSERT INTO product_types (name, description) VALUES
('Shirt', 'Formal and casual shirts'),
('Suit', 'Two-piece and three-piece suits'),
('Blazer', 'Single and double-breasted blazers'),
('Trousers', 'Dress pants and casual trousers'),
('Jacket', 'Outerwear jackets')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- SAMPLE DATA - CUSTOMIZATION OPTIONS
-- ============================================

INSERT INTO customization_options (type, name, description, additional_cost) VALUES
('collar', 'Classic', 'Traditional collar style', 0.00),
('collar', 'Spread', 'Wider collar spread', 500.00),
('collar', 'Button-Down', 'Buttons on collar points', 300.00),
('cuff', 'Barrel', 'Round single-button cuff', 0.00),
('cuff', 'French', 'Double-button cuff for cufflinks', 800.00),
('pocket', 'No Pocket', 'No chest pocket', 0.00),
('pocket', 'Single', 'Single chest pocket', 400.00),
('pocket', 'Double', 'Double chest pockets', 700.00)
ON DUPLICATE KEY UPDATE additional_cost = VALUES(additional_cost);

-- ============================================
-- SAMPLE DATA - 3D GARMENTS
-- ============================================

INSERT INTO garments (name, type, description, model_url) VALUES
('Men\'s Suit', 'suit', 'A customizable men\'s suit for web-based tailoring', '/models/Suit/A_Customizable_Men\'s_Suit_for_Web-Based_Tailoring.glb'),
('Plain T-Shirt', 'tshirt', 'A plain white t-shirt model', '/models/T-Shirt/A_Plain_White_T-Shirt.glb'),
('Modular T-Shirt', 'tshirt', 'A modular t-shirt system with customizable parts', '/models/T-Shirt/A_Modular_T-Shirt_System.glb')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_fabrics_available ON fabrics(is_available);
CREATE INDEX idx_fabrics_category ON fabrics(category_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_garments_type ON garments(type);

-- ============================================
-- EMPLOYEE MANAGEMENT TABLES
-- ============================================

-- Employees table (Admin-controlled only)
CREATE TABLE IF NOT EXISTS employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
    phone VARCHAR(15),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- Payments table (for tracking order payments)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('card', 'upi', 'netbanking', 'cod', 'wallet') NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Activity Log for admin actions
CREATE TABLE IF NOT EXISTS activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    description TEXT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- Insert default admin account (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' generated with bcrypt
INSERT INTO employees (username, email, password_hash, first_name, last_name, role) 
VALUES ('admin', 'admin@indulge.com', '$2b$10$x23OjlzN4ZAITIt3VeQv.eam1nbzpjygIPoJohYRrR3iJ2jEQ3YnW', 'System', 'Admin', 'admin')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Order Cancellations table (for tracking order cancellations and refunds)
CREATE TABLE IF NOT EXISTS order_cancellations (
    cancellation_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT,
    reason TEXT,
    payment_method VARCHAR(20),
    refund_method VARCHAR(20),
    refund_status ENUM('not_applicable', 'pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
    bank_name VARCHAR(100),
    account_holder_name VARCHAR(100),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(15),
    upi_id VARCHAR(100),
    refund_amount DECIMAL(10, 2),
    employee_notes TEXT,
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Product Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    fabric_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fabric_id) REFERENCES fabrics(fabric_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_fabric_review (user_id, fabric_id)
);

-- Additional indexes for reviews
CREATE INDEX idx_reviews_fabric ON reviews(fabric_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Additional indexes for employee tables
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_activity_log_employee ON activity_log(employee_id);
CREATE INDEX idx_activity_log_date ON activity_log(created_at);
CREATE INDEX idx_cancellations_order_id ON order_cancellations(order_id);
CREATE INDEX idx_cancellations_status ON order_cancellations(refund_status);
