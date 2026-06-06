# INDULGE — Premium Custom Tailoring & E-Commerce Platform

A full-stack, production-grade web application for a bespoke tailoring business. Customers can browse fabrics, customize garments in 3D, take measurements, place orders with integrated payment processing, and track deliveries. An employee admin panel manages the entire operation.

---

## 🏗️ Architecture Overview

```
INDULGE WEBSITE/
├── src/                     # Customer-facing frontend (React + Vite)
├── employee/                # Admin/Employee panel (React + Vite + React Router)
├── backend/                 # REST API server (Node.js + Express + MySQL)
├── public/                  # Static assets & 3D models
└── indulge_complete.sql     # Complete database schema (22 tables)
```

### Three Independent Applications

| App | Port | Framework | Purpose |
|-----|------|-----------|---------|
| **Customer Frontend** | `5173` | React 19 + Vite | Shopping, customization, checkout |
| **Employee Panel** | `5174` | React 19 + Vite + React Router | Admin dashboard, order/inventory management |
| **Backend API** | `5001` | Node.js + Express 4 | REST API, auth, payment, database |

---

## ⚙️ Tech Stack

### Frontend (Customer)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite (Rolldown) | 7.2.5 | Build tool with HMR |
| Three.js | 0.182.0 | 3D garment visualization |
| @react-three/fiber | 9.5.0 | React renderer for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers & components |
| Axios | 1.13.2 | HTTP client |
| Lucide React | 0.561.0 | Icon library |
| React DatePicker | 9.1.0 | Date selection for bookings |
| React Image Crop | 11.0.10 | Profile image cropping |
| Razorpay Checkout.js | Latest | Payment gateway SDK (client-side) |

### Frontend (Employee Panel)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| React Router DOM | 7.13.0 | Client-side routing |
| Recharts | 3.7.0 | Dashboard charts & analytics |
| Axios | 1.13.4 | HTTP client |
| Lucide React | 0.563.0 | Icon library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x | Runtime |
| Express | 4.18.2 | Web framework |
| MySQL2 | 3.6.0 | Database driver (connection pooling) |
| JWT (jsonwebtoken) | 9.0.2 | Authentication tokens |
| Bcrypt | 5.1.0 | Password hashing |
| Helmet | 8.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin control |
| Express Rate Limit | 8.2.1 | API rate limiting |
| HPP | 0.2.3 | HTTP parameter pollution protection |
| Multer | 1.4.5 | File upload handling |
| Nodemailer | 7.0.12 | OTP email delivery |
| Razorpay | 2.9.6 | Payment gateway SDK (server-side) |
| Dotenv | 16.3.1 | Environment variable management |
| UUID | 9.0.0 | Unique identifier generation |

### Database
| Technology | Purpose |
|------------|---------|
| MySQL 8.0 | Relational database (via XAMPP) |
| 22 Tables | Full schema with foreign keys, enums, JSON fields |

---

## 📁 Detailed Project Structure

### Customer Frontend (`src/`)

```
src/
├── main.jsx                          # App entry point
├── App.jsx                           # Root component with routing logic
├── App.css                           # Complete design system (200KB+)
├── contexts/
│   └── AppContext.js                 # Global state (auth, cart, notifications)
├── hooks/
│   └── useNotification.js            # Toast notification hook
├── services/
│   ├── api.js                        # REST API client (auth, cart, orders, payments, etc.)
│   └── api3d.js                      # 3D model & visualization API client
├── components/
│   ├── Hero.jsx                      # Landing hero section with animations
│   ├── Navbar.jsx                    # Navigation bar with auth state
│   ├── About.jsx                     # About the brand section
│   ├── Features.jsx                  # Feature highlights
│   ├── Fabrics.jsx                   # Fabric catalog browser
│   ├── ProductDetails.jsx            # Individual fabric/product page
│   ├── Customize.jsx                 # Customization entry point
│   ├── ShirtCustomizationPage.jsx    # 8-step shirt customizer (fabric, collar, cuff, pocket, etc.)
│   ├── VisualizationPage.jsx         # 3D garment preview with Three.js
│   ├── 3d/                           # Three.js 3D rendering components
│   ├── MyMeasurements.jsx            # Body measurement management
│   ├── Booking.jsx                   # Appointment booking system
│   ├── CartModal.jsx                 # Shopping cart overlay
│   ├── CheckoutPage.jsx              # 4-step checkout (summary, address, payment, review)
│   ├── Tracking.jsx                  # Order tracking page
│   ├── ProfilePage.jsx               # User profile management
│   ├── LoginModal.jsx                # Login/Register with OTP verification
│   ├── ImageCropModal.jsx            # Profile image cropper
│   ├── Footer.jsx                    # Site footer
│   ├── Notification.jsx              # Toast notification component
│   └── NotificationsContainer.jsx    # Notification renderer
├── Customization-img's/              # Customization option images
└── Photos/                           # Product/marketing images
```

### Employee Admin Panel (`employee/src/`)

```
employee/src/
├── main.jsx                          # Entry point
├── App.jsx                           # Root with React Router
├── App.css                           # Admin panel styles
├── index.css                         # Base styles
├── contexts/
│   └── AuthContext.jsx               # Admin authentication state
├── services/
│   └── api.js                        # Admin API client
├── components/
│   └── Layout.jsx                    # Sidebar navigation layout
└── pages/
    ├── Login.jsx                     # Employee login
    ├── Dashboard.jsx                 # Analytics dashboard with Recharts
    ├── OrdersManager.jsx             # Order management (view, update status, tracking)
    ├── FabricsManager.jsx            # Fabric inventory CRUD
    ├── UsersManager.jsx              # Customer management
    ├── EmployeesManager.jsx          # Staff management (roles, permissions)
    ├── BookingsManager.jsx           # Appointment management
    ├── MeasurementsManager.jsx       # Customer measurement records
    ├── CouponsManager.jsx            # Discount code management
    ├── CancellationsManager.jsx      # Order cancellation & refund handling
    ├── PaymentsManager.jsx           # Payment transaction monitoring
    ├── ReviewsManager.jsx            # Customer review moderation
    └── ModelsManager.jsx             # 3D model management
```

### Backend (`backend/`)

```
backend/
├── server.js                         # Express server (3200+ lines, all API routes)
├── db.js                             # MySQL connection pool configuration
├── .env                              # Environment variables (secrets, DB config)
├── package.json                      # Dependencies
└── uploads/
    └── profiles/                     # User profile image uploads
```

### Public Assets (`public/`)

```
public/
├── Shirt-logo.png                    # Brand logo
└── models/                           # 3D garment models (.glb/.gltf)
    ├── shirt_model.glb
    ├── collar_models/
    └── cuff_models/
```

---

## 🗄️ Database Schema (22 Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Customer accounts | user_id, email, password_hash, firstName, lastName, phone, address |
| `employees` | Admin/staff accounts | employee_id, username, email, password_hash, role |
| `fabric_categories` | Fabric type grouping | category_id, name |
| `fabrics` | Fabric inventory | fabric_id, name, category_id, price, image_url, stock, description |
| `product_types` | Garment types (Shirt, Trouser, etc.) | type_id, name |
| `customization_options` | Customization choices | option_id, product_type_id, option_type, option_value |
| `orders` | Customer orders | order_id, user_id, order_number, total_amount, status, shipping_address |
| `order_items` | Individual items in orders | item_id, order_id, fabric_id, quantity, unit_price, customization_details(JSON) |
| `order_tracking` | Status history per order | tracking_id, order_id, status(11 stages), location, notes |
| `order_cancellations` | Cancellation records | cancellation_id, order_id, reason, refund_method, refund_status |
| `shopping_cart` | Active shopping carts | cart_id, user_id, fabric_id, quantity, customization_details(JSON) |
| `payments` | Payment transactions | payment_id, order_id, amount, payment_method, transaction_id, status |
| `payment_methods` | Saved payment methods | payment_id, user_id, method_type(card/upi), card_number, upi_id |
| `measurements` | Body measurements (13 fields) | measurement_id, user_id, neck, chest, waist, hip, shoulder, sleeve, etc. |
| `bookings` | Appointment scheduling | booking_id, user_id, service_type, date, time_slot, status |
| `notifications` | User notifications | notification_id, user_id, title, message, type, is_read |
| `coupons` | Discount codes | coupon_id, code, discount_type, discount_value, valid_from, valid_until |
| `coupon_usage` | Coupon usage tracking | usage_id, coupon_id, user_id, order_id |
| `garments` | Garment templates | garment_id, name, model_path |
| `user_configurations` | Saved garment configs | config_id, user_id, garment_id, customization(JSON) |
| `reviews` | Product reviews | review_id, user_id, fabric_id, rating, comment |
| `activity_log` | Admin action audit trail | log_id, employee_id, action_type, table_name, old_values(JSON), new_values(JSON) |

### Order Status Flow
```
pending → processing → in_production → shipped → delivered
                                                → cancelled
```

### Order Tracking Stages (11 Steps)
```
order_placed → payment_confirmed → measurement_scheduled → measurements_taken →
design_approved → production_started → quality_check → packaging →
shipped → out_for_delivery → delivered
```

---

## 🔐 Security Implementation

### Authentication & Authorization
| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | Bcrypt with salt rounds |
| **JWT Tokens** | Signed with 64-char secret, token-based auth on all protected routes |
| **OTP Verification** | 6-digit OTP via email (Nodemailer + Gmail SMTP) for registration |
| **Role-Based Access** | Separate auth middleware for customers (`authenticateToken`) and employees (`authenticateEmployee`) |
| **Token Validation** | Authorization header parsing with Bearer token extraction |

### HTTP Security Headers (Helmet.js)
| Header | Configuration |
|--------|--------------|
| **Content-Security-Policy** | `default-src 'self'`, scripts limited to self + Razorpay, styles from Google Fonts, frames for Razorpay checkout, `object-src 'none'` |
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains; preload` (1 year HSTS) |
| **X-Content-Type-Options** | `nosniff` — prevents MIME type sniffing |
| **X-XSS-Protection** | Enabled — browser XSS filtering |
| **X-Frame-Options** | `DENY` — prevents clickjacking |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Cross-Origin-Resource-Policy** | `cross-origin` (for static uploads) |

### CORS Configuration
| Setting | Value |
|---------|-------|
| **Allowed Origins** | Production: env whitelist only. Dev: `localhost:5173`, `5174`, `3000` |
| **Credentials** | Enabled |
| **Allowed Methods** | `GET, POST, PUT, DELETE, PATCH` |
| **Allowed Headers** | `Content-Type, Authorization` only |
| **Preflight Cache** | `maxAge: 86400` (24 hours) |

### Rate Limiting
| Limiter | Scope | Limit |
|---------|-------|-------|
| **Global** | All `/api/*` routes | 100 requests / 15 min |
| **Auth** | Login/Register endpoints | 10 requests / 15 min |
| **Payment** | Create-order, Verify, Save method | 5 requests / 15 min |
| **Order** | Order placement | 3 requests / 15 min |
| **Review** | Review submission | 20 requests / 15 min |

### Input Validation & Sanitization
| Layer | Details |
|-------|---------|
| **HTML Sanitization** | Custom `sanitize()` strips `<>`, `javascript:`, `on*=` event handlers |
| **Object Sanitization** | `sanitizeObj()` recursively sanitizes all string fields in request bodies |
| **Payment Validation** | Middleware validates: amount (>0, <₹1Cr), UPI format (`user@provider` regex), card number (13-19 digits), payment_method enum |
| **SQL Injection Prevention** | 100% parameterized queries — no string concatenation in SQL |
| **Request Body Limits** | JSON: 10KB max, URL-encoded: 10KB max |
| **File Upload Limits** | 5MB max, MIME type whitelist (`image/jpeg`, `png`, `gif`, `webp`) |
| **HPP Protection** | `hpp()` middleware prevents HTTP Parameter Pollution attacks |

### Payment Security
| Feature | Implementation |
|---------|---------------|
| **Razorpay Signature Verification** | HMAC-SHA256 server-side verification of `razorpay_order_id\|razorpay_payment_id` against `razorpay_signature` |
| **Amount Tampering Prevention** | Amount validated on both frontend and backend; Razorpay order amount set server-side |
| **Order Idempotency** | Duplicate `order_number` submissions rejected within 60-second window using in-memory Map |
| **Card Data Security** | Full card numbers never stored — only masked last 4 digits (`****1234`). CVV never stored. All card processing handled by Razorpay PCI-DSS compliant gateway |
| **Sensitive Log Masking** | `maskSensitive()` utility redacts `card_number`, `cvv`, `password`, `token`, `key_secret`, `razorpay_signature` from error logs |
| **Payment Retry Prevention** | Rate limiter (5 req/15 min) prevents brute-force payment attempts |
| **Server-Side Key Protection** | Razorpay `key_secret` never sent to frontend — only `key_id` exposed via `/api/razorpay-key` |

### Database Security
| Feature | Implementation |
|---------|---------------|
| **Connection Pooling** | MySQL2 connection pool with `connectionLimit`, `enableKeepAlive`, timeouts |
| **Foreign Key Constraints** | Referential integrity with `ON DELETE CASCADE` / `SET NULL` |
| **Enum Constraints** | Database-level ENUM validation for status fields, payment methods |
| **Prepared Statements** | All queries use `connection.execute()` with parameterized values |

---

## 💳 Payment Integration

### Supported Payment Methods
| Method | Flow |
|--------|------|
| **Cash on Delivery (COD)** | Direct order placement, no gateway involved, payment status = `pending` |
| **UPI** | User enters UPI ID → Razorpay popup opens → Payment processed → Signature verified → Order confirmed |
| **Credit/Debit Card** | Card details entered → Razorpay popup → PCI-DSS compliant processing → Signature verified → Order confirmed |

### Payment Flow Diagram
```
Customer selects payment method
├── COD: Order created → payments record (status: pending)
└── UPI/Card:
    ├── 1. Frontend: ordersAPI.create() → Order created in DB
    ├── 2. Frontend: paymentsAPI.createOrder() → Razorpay order created
    ├── 3. Frontend: Razorpay checkout popup opens (prefilled UPI VPA or card)
    ├── 4. Razorpay: Payment processed externally
    ├── 5. Frontend: handler callback receives razorpay_payment_id + signature
    ├── 6. Frontend: paymentsAPI.verify() → Backend verifies HMAC-SHA256 signature
    ├── 7. Backend: payments.status → 'completed', orders.status → 'processing'
    └── 8. Frontend: Cart cleared, success notification shown
```

### Saved Payment Methods
- Users can save UPI IDs and card details (masked) for faster checkout
- Saved methods displayed in checkout with one-click selection
- Delete functionality available for each saved method
- UPI IDs stored in `payment_methods` table with `method_type = 'upi'`
- Card details stored with masked number (`****XXXX`) — full number never stored

### API Endpoints (Payment)
| Method | Endpoint | Middleware | Purpose |
|--------|----------|------------|---------|
| `GET` | `/api/razorpay-key` | `authenticateToken` | Get Razorpay public key |
| `POST` | `/api/payments/create-order` | `authenticateToken`, `paymentLimiter`, `validatePaymentInput` | Create Razorpay order |
| `POST` | `/api/payments/verify` | `authenticateToken`, `paymentLimiter` | Verify Razorpay payment signature |
| `GET` | `/api/payment-methods` | `authenticateToken` | List saved payment methods |
| `POST` | `/api/payment-methods` | `authenticateToken`, `paymentLimiter`, `validatePaymentInput` | Save UPI ID or card |
| `DELETE` | `/api/payment-methods/:id` | `authenticateToken` | Remove saved payment method |

---

## 🔑 Key Features

### Customer Features
- **Fabric Browsing** — Categorized catalog with filters, search, and detailed product pages
- **3D Garment Visualization** — Real-time 3D shirt preview using Three.js with fabric texture mapping
- **8-Step Shirt Customization** — Fabric → Collar → Cuff → Pocket → Placket → Back → Monogram → Size
- **Inline Body Measurements** — 13-field measurement form (neck, chest, waist, shoulder, sleeve, etc.)
- **Smart Cart** — Add/remove customized items with full customization details preserved
- **4-Step Checkout** — Order Summary → Shipping Address → Payment → Review & Confirm
- **Payment Gateway** — Razorpay integration with COD, UPI, and Card support
- **Order Tracking** — 11-stage tracking with real-time status updates
- **Appointment Booking** — Schedule in-person measurement sessions with date/time slots
- **User Profiles** — Profile management with image cropping, address auto-fill, order history
- **OTP Authentication** — Email-based OTP for secure registration
- **Coupon System** — Apply discount codes at checkout
- **Product Reviews** — Rate and review fabrics with star ratings

### Admin/Employee Features
- **Dashboard** — Analytics overview with Recharts graphs
- **Order Management** — View, update status, add tracking events, manage order lifecycle
- **Fabric Inventory** — CRUD operations for fabric catalog, stock management
- **Customer Management** — View and manage customer accounts
- **Employee Management** — Staff CRUD with role-based access
- **Booking Management** — View and manage appointment bookings
- **Measurement Records** — Access customer body measurement data
- **Coupon Management** — Create, edit, activate/deactivate discount codes
- **Cancellation Handling** — Process cancellations and refunds
- **Payment Monitoring** — View all payment transactions and statuses
- **Review Moderation** — Approve, view, or delete customer reviews
- **3D Model Management** — Upload and manage garment 3D models
- **Activity Audit Log** — Track all admin actions with old/new value diffs

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v22+
- MySQL 8.0 (via XAMPP or standalone)
- npm

### 1. Database Setup
```bash
# Import the complete schema into MySQL
mysql -u root -p < indulge_complete.sql
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
# Edit .env with your database credentials, JWT secret, SMTP config, and Razorpay keys
node server.js
```

### 3. Customer Frontend
```bash
# From root directory
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Employee Panel
```bash
cd employee
npm install
npm run dev
# Runs on http://localhost:5174
```

### Environment Variables (`.env`)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=indulge_db

# JWT (64-char random secret)
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
EMPLOYEE_URL=http://localhost:5174

# SMTP (for OTP emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=INDULGE <noreply@indulge.com>

# Razorpay (get from https://razorpay.com → Dashboard → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

---

## 📡 API Endpoints Summary

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/register` | User registration |
| `POST` | `/api/verify-otp` | OTP verification |
| `POST` | `/api/login` | User login (returns JWT) |
| `GET` | `/api/profile` | Get user profile |
| `PUT` | `/api/profile` | Update user profile |
| `POST` | `/api/profile/upload` | Upload profile picture |

### Products & Catalog
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/fabrics` | List all fabrics |
| `GET` | `/api/fabrics/:id` | Get fabric details |
| `GET` | `/api/fabric-categories` | List categories |
| `GET` | `/api/customization-options` | Get customization options |

### Shopping Cart
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/cart` | Get user's cart |
| `POST` | `/api/cart` | Add item to cart |
| `DELETE` | `/api/cart/:id` | Remove item from cart |

### Orders
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/orders` | Place a new order |
| `GET` | `/api/orders` | Get user's orders |
| `GET` | `/api/orders/:id` | Get order details |
| `GET` | `/api/orders/:id/tracking` | Get order tracking history |

### Measurements
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/measurements` | Get user's measurements |
| `POST` | `/api/measurements` | Save/update measurements |

### Bookings
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings` | Get user's bookings |

### Reviews
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/reviews/:fabricId` | Get fabric reviews |
| `POST` | `/api/reviews` | Submit a review |

### Payments
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/razorpay-key` | Get Razorpay public key |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment signature |
| `GET` | `/api/payment-methods` | List saved payment methods |
| `POST` | `/api/payment-methods` | Save payment method |
| `DELETE` | `/api/payment-methods/:id` | Delete payment method |

### Employee/Admin (all prefixed with `/api/employee/`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/login` | Employee login |
| `GET` | `/dashboard` | Dashboard analytics |
| `GET/PUT` | `/orders` | Order management |
| `GET/POST/PUT/DELETE` | `/fabrics` | Fabric CRUD |
| `GET` | `/users` | Customer list |
| `GET/POST/PUT/DELETE` | `/employees` | Staff management |
| `GET/PUT` | `/bookings` | Booking management |
| `GET` | `/measurements` | Measurement records |
| `GET/POST/PUT/DELETE` | `/coupons` | Coupon management |
| `GET/PUT` | `/cancellations` | Cancellation handling |
| `GET` | `/payments` | Payment monitoring |
| `GET/DELETE` | `/reviews` | Review moderation |

---

## 🎨 Design System

- **Premium Aesthetic** — Dark, luxury-grade UI with gold accents and glassmorphism
- **CSS Variables** — Centralized design tokens (`--color-gold`, `--color-primary`, `--color-cream`, etc.)
- **Responsive Design** — Mobile-first with breakpoints for tablet and desktop
- **Micro-Animations** — Smooth transitions, hover effects, and loading states
- **Component Library** — 200KB+ of handcrafted CSS (no Tailwind) for maximum design control
- **Icon System** — Lucide React icons throughout the interface
- **Typography** — Google Fonts integration for premium feel

---

## 📄 License

MIT License — INDULGE Development Team
