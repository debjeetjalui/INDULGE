const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const db = require('./db');
require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '').trim();
};
const sanitizeObj = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = typeof v === 'string' ? sanitize(v) : v;
  }
  return clean;
};

const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://*.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://*.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}));
app.use(hpp());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, process.env.EMPLOYEE_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiters disabled for demo
const authLimiter = (req, res, next) => next();
const reviewLimiter = (req, res, next) => next();
const paymentLimiter = (req, res, next) => next();
const orderLimiter = (req, res, next) => next();

const validatePaymentInput = (req, res, next) => {
  const { amount, payment_method, upi_id, card_number } = req.body;
  if (amount !== undefined) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || parsed > 10000000) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
  }
  if (payment_method && !['cod', 'upi', 'card', 'netbanking', 'wallet'].includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }
  if (upi_id && !/^[a-zA-Z0-9.\-_]{2,50}@[a-zA-Z]{2,20}$/.test(upi_id)) {
    return res.status(400).json({ error: 'Invalid UPI ID format' });
  }
  if (card_number && !/^[0-9\s]{13,19}$/.test(card_number.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Invalid card number format' });
  }
  next();
};

const recentOrderKeys = new Map();
const idempotencyCheck = (req, res, next) => {
  const userId = req.user?.userId;
  const key = `${userId}_${req.body.order_number}`;
  if (recentOrderKeys.has(key)) {
    return res.status(409).json({ error: 'Duplicate order detected. Please refresh and try again.' });
  }
  recentOrderKeys.set(key, Date.now());
  setTimeout(() => recentOrderKeys.delete(key), 60000);
  next();
};

const maskSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const masked = { ...obj };
  const sensitiveKeys = ['card_number', 'cvv', 'password', 'token', 'key_secret', 'razorpay_signature'];
  for (const key of sensitiveKeys) {
    if (masked[key]) masked[key] = '****';
  }
  return masked;
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.includes('your_')) {
  console.error('FATAL: Set a strong JWT_SECRET in .env before running!');
  process.exit(1);
}

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const emailWrapper = (bodyContent) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #fafafa; padding: 0;">
    <div style="background: linear-gradient(135deg, #1a1210 0%, #2c1f1a 100%); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 3px;">INDULGE</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 11px; letter-spacing: 2px;">BESPOKE TAILORING</p>
    </div>
    <div style="padding: 35px 30px; background: #ffffff;">
      ${bodyContent}
    </div>
    <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} INDULGE Bespoke Tailoring. All rights reserved.</p>
      <p style="color: #bbb; font-size: 11px; margin: 8px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>`;

const statusLabels = {
  pending: 'Order Placed',
  processing: 'Processing',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const statusDescriptions = {
  pending: 'Your order has been received and is awaiting confirmation.',
  processing: 'Your order has been confirmed and is now being processed. Our team is reviewing your customization details.',
  in_production: 'Great news! Your garment has entered production. Our master tailors are crafting your custom piece with precision and care.',
  quality_check: 'Your garment is undergoing our rigorous quality inspection to ensure it meets INDULGE standards of excellence.',
  shipped: 'Your order has been dispatched! It is on its way to you. You can track the delivery using the tracking details below.',
  out_for_delivery: 'Your order is out for delivery today! Please ensure someone is available to receive it.',
  delivered: 'Your order has been successfully delivered. We hope you love your custom garment! Thank you for choosing INDULGE.',
  cancelled: 'Your order has been cancelled as per your request.'
};

const statusEmoji = {
  pending: '📋', processing: '⚙️', in_production: '🧵', quality_check: '✅',
  shipped: '📦', out_for_delivery: '🚚', delivered: '🎉', cancelled: '❌'
};

async function sendOrderConfirmationEmail(userEmail, orderData) {
  try {
    const { order_number, total_amount, shipping_address, payment_method, items } = orderData;
    const pmLabel = payment_method === 'cod' ? 'Cash on Delivery' : payment_method === 'upi' ? 'UPI' : 'Credit/Debit Card';
    const orderDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    let itemRows = '';
    if (items && items.length > 0) {
      for (const item of items) {
        const itemTotal = (item.unit_price * item.quantity).toFixed(2);
        let customDetails = '';
        if (item.customization_details) {
          const cd = typeof item.customization_details === 'string' ? JSON.parse(item.customization_details) : item.customization_details;
          const parts = [];
          if (cd.collar) parts.push(`Collar: ${cd.collar}`);
          if (cd.cuff) parts.push(`Cuff: ${cd.cuff}`);
          if (cd.pocket) parts.push(`Pocket: ${cd.pocket}`);
          if (cd.fit) parts.push(`Fit: ${cd.fit}`);
          if (cd.placket) parts.push(`Placket: ${cd.placket}`);
          if (cd.monogram) parts.push(`Monogram: ${cd.monogram}`);
          if (cd.fabric_name) parts.push(`Fabric: ${cd.fabric_name}`);
          if (parts.length) customDetails = `<br><span style="color:#999;font-size:12px;">${parts.join(' · ')}</span>`;
        }
        itemRows += `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;">${item.fabric_name || 'Custom Garment'}${customDetails}</td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${parseFloat(item.unit_price).toFixed(2)}</td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${itemTotal}</td>
          </tr>`;
      }
    }

    let addressBlock = '';
    if (shipping_address) {
      try {
        const addr = typeof shipping_address === 'string' ? JSON.parse(shipping_address) : shipping_address;
        addressBlock = `${addr.fullName || ''}<br>${addr.address || ''}<br>${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br>Phone: ${addr.phone || ''}`;
      } catch { addressBlock = shipping_address; }
    }

    const body = `
      <div style="text-align:center;margin-bottom:25px;">
        <div style="display:inline-block;background:#d4af37;color:#fff;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">ORDER CONFIRMED ✓</div>
      </div>
      <h2 style="color:#1a1210;margin:0 0 5px;font-size:22px;text-align:center;">Thank You for Your Order!</h2>
      <p style="color:#666;font-size:15px;line-height:1.6;text-align:center;margin:0 0 25px;">
        Your bespoke order has been placed successfully. Here are your order details.
      </p>

      <div style="background:#faf8f5;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin-bottom:25px;">
        <table width="100%" style="font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;color:#888;">Order Number:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${order_number}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Order Date:</td><td style="padding:4px 0;text-align:right;">${orderDate}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Payment Method:</td><td style="padding:4px 0;text-align:right;">${pmLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Status:</td><td style="padding:4px 0;text-align:right;"><span style="color:#d4af37;font-weight:600;">Confirmed</span></td></tr>
        </table>
      </div>

      <h3 style="color:#1a1210;font-size:15px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #d4af37;padding-bottom:8px;">Order Items</h3>
      <table width="100%" style="border-collapse:collapse;font-size:14px;color:#333;margin-bottom:20px;">
        <thead>
          <tr style="background:#faf8f5;">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#1a1210;border-bottom:2px solid #e8e0d4;">Item</th>
            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#1a1210;border-bottom:2px solid #e8e0d4;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#1a1210;border-bottom:2px solid #e8e0d4;">Price</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#1a1210;border-bottom:2px solid #e8e0d4;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="background:#1a1210;">
            <td colspan="3" style="padding:14px 12px;color:#fff;font-weight:600;font-size:15px;">TOTAL AMOUNT</td>
            <td style="padding:14px 12px;color:#d4af37;font-weight:700;font-size:16px;text-align:right;">₹${parseFloat(total_amount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      ${addressBlock ? `
      <h3 style="color:#1a1210;font-size:15px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #d4af37;padding-bottom:8px;">Shipping Address</h3>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 20px;">${addressBlock}</p>
      ` : ''}

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:18px;margin:20px 0;">
        <h4 style="color:#e65100;margin:0 0 8px;font-size:14px;">⚠️ Important: No Return / Exchange Policy</h4>
        <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
          As all INDULGE garments are <strong>custom-made to your exact measurements and specifications</strong>, 
          we do not accept returns or exchanges. Each piece is uniquely crafted for you, making it non-transferable. 
          Please ensure all measurements and customization choices are accurate before placing your order.
          If you find a manufacturing defect, please contact us within 48 hours of delivery.
        </p>
      </div>

      <div style="background:#f0faf0;border:1px solid #c8e6c9;border-radius:8px;padding:18px;margin:20px 0 0;">
        <h4 style="color:#2e7d32;margin:0 0 8px;font-size:14px;">📦 What's Next?</h4>
        <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
          Our team will review your order and begin production soon. You will receive email updates at every stage — 
          from fabric cutting to quality check to shipping. Estimated delivery is <strong>7–14 business days</strong> 
          depending on customization complexity.
        </p>
      </div>`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: userEmail,
      subject: `Order Confirmed — #${order_number} | INDULGE`,
      html: emailWrapper(body)
    });
    console.log(`[EMAIL] Order confirmation sent to ${userEmail} for #${order_number}`);
  } catch (err) {
    console.error('[EMAIL] Order confirmation failed:', err.message);
  }
}

async function sendTrackingUpdateEmail(userEmail, orderNumber, newStatus, totalAmount) {
  try {
    const label = statusLabels[newStatus] || newStatus;
    const description = statusDescriptions[newStatus] || 'Your order status has been updated.';
    const emoji = statusEmoji[newStatus] || '📋';

    const allStatuses = ['pending', 'processing', 'in_production', 'quality_check', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIdx = allStatuses.indexOf(newStatus);
    const progressPercent = currentIdx >= 0 ? Math.round(((currentIdx + 1) / allStatuses.length) * 100) : 0;

    let progressBar = '';
    if (newStatus !== 'cancelled') {
      progressBar = `
        <div style="margin:20px 0;">
          <div style="background:#e8e0d4;border-radius:10px;height:10px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#d4af37,#c9953c);height:100%;width:${progressPercent}%;border-radius:10px;transition:width 0.3s;"></div>
          </div>
          <p style="color:#999;font-size:12px;margin:6px 0 0;text-align:right;">${progressPercent}% Complete</p>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">
          ${allStatuses.map((s, i) => {
            const done = i <= currentIdx;
            return `<span style="display:inline-block;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:500;${done ? 'background:#d4af37;color:#fff;' : 'background:#f0f0f0;color:#999;'}">${statusLabels[s]}</span>`;
          }).join('')}
        </div>`;
    }

    const body = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:10px;">${emoji}</div>
        <h2 style="color:#1a1210;margin:0 0 5px;font-size:22px;">Order Status Updated</h2>
        <p style="color:#d4af37;font-size:16px;font-weight:600;margin:0;">${label}</p>
      </div>

      <div style="background:#faf8f5;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin-bottom:20px;">
        <table width="100%" style="font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;color:#888;">Order Number:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${orderNumber}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Current Status:</td><td style="padding:4px 0;text-align:right;"><span style="color:#d4af37;font-weight:600;">${label}</span></td></tr>
          ${totalAmount ? `<tr><td style="padding:4px 0;color:#888;">Order Total:</td><td style="padding:4px 0;text-align:right;">₹${parseFloat(totalAmount).toFixed(2)}</td></tr>` : ''}
        </table>
      </div>

      ${progressBar}

      <div style="background:#f8f8f8;border-left:4px solid #d4af37;border-radius:4px;padding:16px;margin-bottom:20px;">
        <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">${description}</p>
      </div>

      <p style="color:#999;font-size:13px;text-align:center;margin:0;">
        You can track your order anytime from your INDULGE account dashboard.
      </p>`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: userEmail,
      subject: `${emoji} Order #${orderNumber} — ${label} | INDULGE`,
      html: emailWrapper(body)
    });
    console.log(`[EMAIL] Tracking update (${newStatus}) sent to ${userEmail} for #${orderNumber}`);
  } catch (err) {
    console.error('[EMAIL] Tracking update failed:', err.message);
  }
}

async function sendCancellationEmail(userEmail, orderNumber, totalAmount, cancellationData) {
  try {
    const { reason, paymentMethod, refundStatus, refundMethod, refundAmount } = cancellationData;
    const isCOD = paymentMethod === 'cod';

    let refundBlock = '';
    if (isCOD) {
      refundBlock = `
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:15px 0;">
          <p style="color:#666;font-size:14px;margin:0;">💵 <strong>No refund applicable</strong> — This was a Cash on Delivery order, so no payment was charged.</p>
        </div>`;
    } else {
      refundBlock = `
        <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:16px;margin:15px 0;">
          <h4 style="color:#2e7d32;margin:0 0 10px;font-size:14px;">💰 Refund Information</h4>
          <table width="100%" style="font-size:14px;color:#333;">
            <tr><td style="padding:3px 0;color:#888;">Refund Amount:</td><td style="padding:3px 0;text-align:right;font-weight:600;">₹${parseFloat(refundAmount || totalAmount).toFixed(2)}</td></tr>
            <tr><td style="padding:3px 0;color:#888;">Refund Method:</td><td style="padding:3px 0;text-align:right;">${refundMethod === 'original' ? 'Original Payment Method' : (refundMethod || 'To be determined')}</td></tr>
            <tr><td style="padding:3px 0;color:#888;">Refund Status:</td><td style="padding:3px 0;text-align:right;"><span style="color:#e65100;font-weight:600;">${refundStatus === 'pending' ? 'Processing' : refundStatus}</span></td></tr>
          </table>
          <p style="color:#888;font-size:12px;margin:10px 0 0;">Refunds typically take 5–7 business days to reflect in your account.</p>
        </div>`;
    }

    const body = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:10px;">❌</div>
        <h2 style="color:#1a1210;margin:0 0 5px;font-size:22px;">Order Cancelled</h2>
        <p style="color:#888;font-size:14px;margin:0;">Your order has been cancelled as requested.</p>
      </div>

      <div style="background:#faf8f5;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin-bottom:20px;">
        <table width="100%" style="font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;color:#888;">Order Number:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${orderNumber}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Order Total:</td><td style="padding:4px 0;text-align:right;">₹${parseFloat(totalAmount).toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Payment Method:</td><td style="padding:4px 0;text-align:right;">${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : 'Card'}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Cancellation Reason:</td><td style="padding:4px 0;text-align:right;">${reason || 'Not specified'}</td></tr>
        </table>
      </div>

      ${refundBlock}

      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px;margin:15px 0;">
        <p style="color:#666;font-size:13px;margin:0;">
          If you did not request this cancellation or have any questions, please contact our support team immediately at 
          <a href="mailto:support@indulge.com" style="color:#d4af37;">support@indulge.com</a>.
        </p>
      </div>`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: userEmail,
      subject: `Order Cancelled — #${orderNumber} | INDULGE`,
      html: emailWrapper(body)
    });
    console.log(`[EMAIL] Cancellation email sent to ${userEmail} for #${orderNumber}`);
  } catch (err) {
    console.error('[EMAIL] Cancellation email failed:', err.message);
  }
}

async function sendRefundProcessedEmail(userEmail, orderNumber, refundData) {
  try {
    const { refundAmount, refundMethod, refundStatus } = refundData;
    const isCompleted = refundStatus === 'completed';

    const body = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:10px;">${isCompleted ? '✅' : '🔄'}</div>
        <h2 style="color:#1a1210;margin:0 0 5px;font-size:22px;">${isCompleted ? 'Refund Processed Successfully' : 'Refund Status Updated'}</h2>
        <p style="color:#888;font-size:14px;margin:0;">Here are the details of your refund.</p>
      </div>

      <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:25px;margin-bottom:20px;text-align:center;">
        <p style="color:#888;font-size:13px;margin:0 0 5px;">REFUND AMOUNT</p>
        <p style="color:#2e7d32;font-size:28px;font-weight:700;margin:0;">₹${parseFloat(refundAmount).toFixed(2)}</p>
      </div>

      <div style="background:#faf8f5;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin-bottom:20px;">
        <table width="100%" style="font-size:14px;color:#333;">
          <tr><td style="padding:4px 0;color:#888;">Order Number:</td><td style="padding:4px 0;font-weight:600;text-align:right;">${orderNumber}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Refund Status:</td><td style="padding:4px 0;text-align:right;"><span style="color:${isCompleted ? '#2e7d32' : '#e65100'};font-weight:600;">${isCompleted ? 'Completed' : (refundStatus || 'Processing')}</span></td></tr>
          <tr><td style="padding:4px 0;color:#888;">Refund Method:</td><td style="padding:4px 0;text-align:right;">${refundMethod === 'original' ? 'Original Payment Method' : (refundMethod || 'Bank Transfer')}</td></tr>
        </table>
      </div>

      <div style="background:#f8f8f8;border-left:4px solid #d4af37;border-radius:4px;padding:16px;">
        <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">
          ${isCompleted 
            ? 'Your refund has been successfully processed. The amount should reflect in your account within 2–5 business days depending on your bank or payment provider.' 
            : 'Your refund is being processed. We will notify you once it is completed.'}
        </p>
      </div>`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: userEmail,
      subject: `${isCompleted ? 'Refund Processed' : 'Refund Update'} — #${orderNumber} | INDULGE`,
      html: emailWrapper(body)
    });
    console.log(`[EMAIL] Refund email sent to ${userEmail} for #${orderNumber}`);
  } catch (err) {
    console.error('[EMAIL] Refund email failed:', err.message);
  }
}


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const otpStore = new Map();

app.post('/api/auth/check-email', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const connection = await db.getConnection();
    const [users] = await connection.execute(
      'SELECT user_id FROM users WHERE email = ?', 
      [email]
    );
    connection.release();
    
    res.json({ 
      exists: users.length > 0,
      email 
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/send-otp', authLimiter, async (req, res) => {
  try {
    const { email, isNewUser } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt });

    const subject = isNewUser 
      ? 'INDULGE - Verify Your New Account'
      : 'INDULGE - Your Login Verification Code';
    const heading = isNewUser 
      ? 'Welcome to INDULGE! 🎉'
      : 'Welcome Back! 👋';
    const message = isNewUser 
      ? 'Use the following code to verify your new account and complete registration.'
      : 'Use the following code to securely sign in to your INDULGE account.';
    const codeLabel = isNewUser 
      ? 'YOUR VERIFICATION CODE'
      : 'YOUR LOGIN CODE';

    const mailOptions = {
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%); padding: 30px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 4px; font-weight: 600;">INDULGE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">BESPOKE TAILORING</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin: 0 0 20px; font-size: 24px; text-align: center;">${heading}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
              ${message}
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); border: 2px solid #D4AF37; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #888; font-size: 14px; margin: 0 0 10px; letter-spacing: 1px;">${codeLabel}</p>
              <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #5D4037; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0;">This code expires in <strong>10 minutes</strong></p>
            </div>
            
            <!-- Security Notice -->
            <div style="background: #FFF8E1; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #5D4037; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> Never share this code with anyone. 
                INDULGE staff will never ask for your verification code.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} INDULGE Bespoke Tailoring. All rights reserved.
            </p>
            <p style="color: #bbb; font-size: 11px; margin: 10px 0 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent successfully', email });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  try {
    const body = sanitizeObj(req.body);
    const { email, otp, firstName, lastName, phone } = body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    otpStore.delete(email);

    const connection = await db.getConnection();
    const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    let user;
    let isNewUser = false;

    if (existingUsers.length === 0) {
      const username = email.split('@')[0];
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, firstName || username, lastName || '', phone || '']
      );

      user = {
        user_id: result.insertId,
        username,
        email,
        first_name: firstName || username,
        last_name: lastName || '',
        phone: phone || ''
      };
      isNewUser = true;
    } else {
      user = existingUsers[0];
    }

    connection.release();

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name || '',
        phone: user.phone || ''
      },
      isNewUser
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const body = sanitizeObj(req.body);
    const { username, email, password, first_name, last_name, phone, address } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const connection = await db.getConnection();
    const [result] = await connection.execute(query, [username, email, hashedPassword, first_name, last_name, phone, address]);
    connection.release();

    const token = jwt.sign(
      { userId: result.insertId, email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [email]);
    connection.release();

    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.execute(
      'SELECT user_id, username, email, first_name, last_name, phone, address, profile_image, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      address: user.address,
      profileImage: user.profile_image,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const connection = await db.getConnection();

    const updates = [];
    const values = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.userId);

    await connection.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    connection.release();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/profile/image', authenticateToken, uploadProfile.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;

    const connection = await db.getConnection();
    await connection.execute(
      'UPDATE users SET profile_image = ? WHERE user_id = ?',
      [imagePath, req.user.userId]
    );
    connection.release();

    res.json({
      message: 'Profile image uploaded successfully',
      profileImage: imagePath
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/profile/orders', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [orders] = await connection.execute(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
       FROM orders o 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );

    let ordersWithPayment = orders;
    try {
      const [tableCheck] = await connection.execute(
        "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payments'"
      );
      if (tableCheck[0].cnt > 0) {
        ordersWithPayment = await Promise.all(orders.map(async (order) => {
          const [payments] = await connection.execute(
            'SELECT payment_method FROM payments WHERE order_id = ? LIMIT 1',
            [order.order_id]
          );
          return { ...order, payment_method: payments.length > 0 ? payments[0].payment_method : 'cod' };
        }));
      } else {
        ordersWithPayment = orders.map(o => ({ ...o, payment_method: 'cod' }));
      }
    } catch {
      ordersWithPayment = orders.map(o => ({ ...o, payment_method: 'cod' }));
    }
    connection.release();

    res.json(ordersWithPayment);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/orders', authenticateToken, orderLimiter, validatePaymentInput, idempotencyCheck, async (req, res) => {
  try {
    const { order_number, total_amount, shipping_address, billing_address, notes, items, payment_method } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    const connection = await db.getConnection();
    const pmMethod = payment_method || 'cod';
    const orderStatus = pmMethod === 'cod' ? 'pending' : 'pending';

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, billing_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, order_number, total_amount, orderStatus, shipping_address, billing_address, notes]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      const totalPrice = item.unit_price * item.quantity;
      await connection.execute(
        `INSERT INTO order_items (order_id, fabric_id, product_type_id, quantity, unit_price, total_price, customization_details)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.fabric_id,
          item.product_type_id || null,
          item.quantity,
          item.unit_price,
          totalPrice,
          item.customization_details ? JSON.stringify(item.customization_details) : null
        ]
      );
    }

    await connection.execute(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, req.user.userId, total_amount, pmMethod, pmMethod === 'cod' ? 'pending' : 'pending', `Payment: ${pmMethod.toUpperCase()}`]
    );

    // Fetch user email & fabric names for email
    let userEmail = null;
    try {
      const [userRows] = await connection.execute('SELECT email FROM users WHERE user_id = ?', [req.user.userId]);
      if (userRows.length > 0) userEmail = userRows[0].email;
    } catch (e) { /* ignore */ }

    let enrichedItems = items;
    try {
      enrichedItems = [];
      for (const item of items) {
        const [fabRows] = await connection.execute('SELECT name FROM fabrics WHERE fabric_id = ?', [item.fabric_id]);
        enrichedItems.push({ ...item, fabric_name: fabRows.length > 0 ? fabRows[0].name : 'Custom Garment' });
      }
    } catch (e) { enrichedItems = items; }

    connection.release();

    // Fire-and-forget: send order confirmation email
    if (userEmail) {
      sendOrderConfirmationEmail(userEmail, {
        order_number, total_amount, shipping_address,
        payment_method: pmMethod, items: enrichedItems
      }).catch(() => {});
    }

    res.status(201).json({ 
      message: 'Order placed successfully',
      orderId: orderId,
      orderNumber: order_number
    });
  } catch (error) {
    console.error('[ORDER] Create order error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

(async () => {
  try {
    const connection = await db.getConnection();
    await connection.execute(`
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
      )
    `);
    connection.release();
  } catch (error) {
    console.error('[CANCEL] Error initializing cancellations table:', error.message);
  }
})();

app.post('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;
    const { reason, refund_method, bank_name, account_holder_name, account_number, ifsc_code, upi_id } = req.body;

    const connection = await db.getConnection();

    const [orders] = await connection.execute(
      'SELECT order_id, status, total_amount FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    if (order.status === 'delivered') {
      connection.release();
      return res.status(400).json({ error: 'Cannot cancel a delivered order. Please use the return option instead.' });
    }
    if (order.status === 'cancelled') {
      connection.release();
      return res.status(400).json({ error: 'This order is already cancelled.' });
    }

    let paymentMethod = 'cod';
    let refundAmount = order.total_amount;
    let paymentsExist = false;
    try {
      const [tableCheck] = await connection.execute(
        "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'payments'"
      );
      if (tableCheck[0].cnt > 0) {
        paymentsExist = true;
        const [payments] = await connection.execute(
          'SELECT payment_method, amount FROM payments WHERE order_id = ? LIMIT 1',
          [orderId]
        );
        if (payments.length > 0) {
          paymentMethod = payments[0].payment_method;
          refundAmount = payments[0].amount;
        }
      }
    } catch {
    }

    const isCOD = paymentMethod === 'cod';

    const refundStatus = isCOD ? 'not_applicable' : 'pending';
    const actualRefundMethod = isCOD ? 'none' : (refund_method || 'original');

    await connection.execute(
      `INSERT INTO order_cancellations 
        (order_id, user_id, reason, payment_method, refund_method, refund_status, 
         bank_name, account_holder_name, account_number, ifsc_code, upi_id, refund_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, userId, reason || 'No reason provided',
        paymentMethod, actualRefundMethod, refundStatus,
        isCOD ? null : (bank_name || null),
        isCOD ? null : (account_holder_name || null),
        isCOD ? null : (account_number || null),
        isCOD ? null : (ifsc_code || null),
        isCOD ? null : (upi_id || null),
        isCOD ? null : refundAmount
      ]
    );

    await connection.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['cancelled', orderId]
    );

    if (!isCOD && paymentsExist) {
      try {
        await connection.execute(
          'UPDATE payments SET status = ? WHERE order_id = ?',
          ['refunded', orderId]
        );
      } catch {
      }
    }

    // Fetch user email and order number for cancellation email
    let cancelUserEmail = null;
    let cancelOrderNumber = null;
    try {
      const [uRows] = await connection.execute('SELECT email FROM users WHERE user_id = ?', [userId]);
      if (uRows.length > 0) cancelUserEmail = uRows[0].email;
      const [oRows] = await connection.execute('SELECT order_number FROM orders WHERE order_id = ?', [orderId]);
      if (oRows.length > 0) cancelOrderNumber = oRows[0].order_number;
    } catch (e) { /* ignore */ }

    connection.release();

    // Fire-and-forget: send cancellation email
    if (cancelUserEmail && cancelOrderNumber) {
      sendCancellationEmail(cancelUserEmail, cancelOrderNumber, order.total_amount, {
        reason: reason || 'No reason provided',
        paymentMethod,
        refundStatus,
        refundMethod: actualRefundMethod,
        refundAmount
      }).catch(() => {});
    }

    res.json({
      message: isCOD
        ? 'Order cancelled successfully. No refund is applicable as you chose COD.'
        : 'Order cancelled successfully. Your refund will be processed shortly.',
      cancellation: {
        orderId,
        paymentMethod,
        refundStatus,
        refundMethod: actualRefundMethod
      }
    });
  } catch (error) {
    console.error('[CANCEL] Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

(async () => {
  try {
    const connection = await db.getConnection();
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shopping_cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        fabric_id INT NOT NULL,
        quantity INT DEFAULT 1,
        UNIQUE KEY unique_user_fabric (user_id, fabric_id)
      )
    `);
    
    try {
      await connection.execute(`ALTER TABLE shopping_cart ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) { /* Column might already exist */ }
    
    try {
      await connection.execute(`ALTER TABLE shopping_cart ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    } catch (e) { /* Column might already exist */ }
    
    connection.release();
  } catch (error) {
    console.error('[CART] Error initializing cart table:', error.message);
  }
})();

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [cartItems] = await connection.execute(
      `SELECT 
        sc.cart_id,
        sc.fabric_id,
        sc.quantity,
        sc.product_type_id,
        sc.total_price,
        sc.customization_details,
        f.name as fabric_name,
        f.price as fabric_price,
        f.image_url,
        f.color_hex,
        f.composition
       FROM shopping_cart sc
       JOIN fabrics f ON sc.fabric_id = f.fabric_id
       WHERE sc.user_id = ?
       ORDER BY sc.cart_id DESC`,
      [req.user.userId]
    );
    connection.release();
    
    const parsedItems = cartItems.map(item => ({
      ...item,
      customization_details: item.customization_details 
        ? (typeof item.customization_details === 'string' 
            ? JSON.parse(item.customization_details) 
            : item.customization_details)
        : null
    }));
    res.json(parsedItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { fabric_id, quantity = 1, product_type_id = null, total_price = null, customization_details = null } = req.body;

    if (!fabric_id) {
      return res.status(400).json({ error: 'Fabric ID is required' });
    }

    const connection = await db.getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shopping_cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        fabric_id INT NOT NULL,
        product_type_id INT NULL,
        quantity INT DEFAULT 1,
        total_price DECIMAL(10,2) NULL,
        customization_details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    try {
      await connection.execute(`ALTER TABLE shopping_cart ADD COLUMN product_type_id INT NULL`);
    } catch (e) { /* Column might already exist */ }
    try {
      await connection.execute(`ALTER TABLE shopping_cart ADD COLUMN total_price DECIMAL(10,2) NULL`);
    } catch (e) { /* Column might already exist */ }
    try {
      await connection.execute(`ALTER TABLE shopping_cart ADD COLUMN customization_details JSON NULL`);
    } catch (e) { /* Column might already exist */ }

    const [fabric] = await connection.execute(
      'SELECT fabric_id, name, price FROM fabrics WHERE fabric_id = ?',
      [fabric_id]
    );

    if (fabric.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Fabric not found' });
    }

    const customizationJSON = customization_details ? JSON.stringify(customization_details) : null;
    await connection.execute(
      `INSERT INTO shopping_cart (user_id, fabric_id, quantity, product_type_id, total_price, customization_details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.userId, fabric_id, quantity, product_type_id, total_price, customizationJSON]
    );

    connection.release();
    res.status(201).json({ 
      message: 'Item added to cart',
      fabric_name: fabric[0].name
    });
  } catch (error) {
    console.error('[CART] Add to cart error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const cartId = req.params.id;
    const connection = await db.getConnection();

    const [item] = await connection.execute(
      'SELECT cart_id FROM shopping_cart WHERE cart_id = ? AND user_id = ?',
      [cartId, req.user.userId]
    );

    if (item.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await connection.execute(
      'DELETE FROM shopping_cart WHERE cart_id = ? AND user_id = ?',
      [cartId, req.user.userId]
    );

    connection.release();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/profile/bookings', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [bookings] = await connection.execute(
      `SELECT 
        booking_id,
        booking_date,
        booking_time,
        status,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        notes,
        created_at,
        updated_at
       FROM bookings
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    connection.release();

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const connection = await db.getConnection();

    // Check if user has prior non-cancelled bookings
    const [priorBookings] = await connection.execute(
      "SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status IN ('pending', 'confirmed', 'completed')",
      [req.user.userId]
    );
    const bookingCount = priorBookings[0].count;

    if (bookingCount > 0) {
      connection.release();
      return res.status(400).json({ 
        error: 'Payment required for subsequent bookings',
        requiresPayment: true,
        bookingCount: bookingCount
      });
    }

    const [users] = await connection.execute(
      'SELECT first_name, last_name, email, phone, address FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer';

    const [result] = await connection.execute(
      `INSERT INTO bookings 
        (user_id, booking_date, booking_time, status, customer_name, customer_email, customer_phone, customer_address, booking_type, payment_status)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 'free', 'not_required')`,
      [req.user.userId, date, time, customerName, user.email, user.phone || '', user.address || '']
    );
    connection.release();

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId,
      booking: {
        booking_id: result.insertId,
        booking_date: date,
        booking_time: time,
        status: 'pending',
        booking_type: 'free',
        payment_status: 'not_required',
        customer_name: customerName,
        customer_email: user.email,
        customer_phone: user.phone,
        customer_address: user.address
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const connection = await db.getConnection();

    const [bookings] = await connection.execute(
      'SELECT booking_id, status FROM bookings WHERE booking_id = ? AND user_id = ?',
      [bookingId, req.user.userId]
    );

    if (bookings.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (booking.status === 'cancelled') {
      connection.release();
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      connection.release();
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    await connection.execute(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      ['cancelled', bookingId]
    );
    connection.release();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== BOOKING PAYMENT LOGIC ====================

// Auto-migration: Add booking payment columns
(async () => {
  try {
    const connection = await db.getConnection();
    const columnsToAdd = [
      { name: 'booking_type', sql: "ALTER TABLE bookings ADD COLUMN booking_type ENUM('free', 'paid') DEFAULT 'free'" },
      { name: 'payment_status', sql: "ALTER TABLE bookings ADD COLUMN payment_status ENUM('not_required', 'pending', 'completed', 'failed') DEFAULT 'not_required'" },
      { name: 'razorpay_payment_id', sql: "ALTER TABLE bookings ADD COLUMN razorpay_payment_id VARCHAR(100) NULL" },
      { name: 'razorpay_order_id', sql: "ALTER TABLE bookings ADD COLUMN razorpay_order_id VARCHAR(100) NULL" },
      { name: 'amount_paid', sql: "ALTER TABLE bookings ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0.00" }
    ];
    for (const col of columnsToAdd) {
      try {
        await connection.execute(col.sql);
        console.log(`[BOOKING] Added column: ${col.name}`);
      } catch (e) { /* Column already exists */ }
    }
    connection.release();
  } catch (error) {
    console.error('[BOOKING] Error adding booking payment columns:', error.message);
  }
})();

const MEASUREMENT_FEE = 500; // INR

// Check if user qualifies for free first visit
app.get('/api/bookings/check-first-visit', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status IN ('pending', 'confirmed', 'completed')",
      [req.user.userId]
    );
    connection.release();
    const bookingCount = rows[0].count;
    res.json({ isFirstVisit: bookingCount === 0, bookingCount });
  } catch (error) {
    console.error('Check first visit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Razorpay order for paid measurement booking
app.post('/api/bookings/create-paid-order', authenticateToken, async (req, res) => {
  try {
    const options = {
      amount: Math.round(MEASUREMENT_FEE * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `booking_${req.user.userId}_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      measurementFee: MEASUREMENT_FEE
    });
  } catch (error) {
    console.error('[BOOKING PAYMENT] Create order error:', error);
    res.status(500).json({ error: 'Payment gateway error' });
  }
});

// Verify Razorpay payment and create paid booking
app.post('/api/bookings/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, date, time } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment details are required' });
    }
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const connection = await db.getConnection();

    const [users] = await connection.execute(
      'SELECT first_name, last_name, email, phone, address FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer';

    const [result] = await connection.execute(
      `INSERT INTO bookings 
        (user_id, booking_date, booking_time, status, customer_name, customer_email, customer_phone, customer_address, booking_type, payment_status, razorpay_payment_id, razorpay_order_id, amount_paid)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, 'paid', 'completed', ?, ?, ?)`,
      [req.user.userId, date, time, customerName, user.email, user.phone || '', user.address || '', razorpay_payment_id, razorpay_order_id, MEASUREMENT_FEE]
    );
    connection.release();

    res.status(201).json({
      message: 'Payment verified and booking created successfully',
      bookingId: result.insertId,
      booking: {
        booking_id: result.insertId,
        booking_date: date,
        booking_time: time,
        status: 'pending',
        booking_type: 'paid',
        payment_status: 'completed',
        amount_paid: MEASUREMENT_FEE,
        customer_name: customerName,
        customer_email: user.email,
        customer_phone: user.phone,
        customer_address: user.address
      }
    });
  } catch (error) {
    console.error('[BOOKING PAYMENT] Verify error:', error);
    res.status(500).json({ error: 'Payment verification error' });
  }
});

// ==================== END BOOKING PAYMENT LOGIC ====================

app.get('/api/fabrics', async (req, res) => {
  try {
    const query = `
      SELECT f.*, fc.name as category_name
      FROM fabrics f
      LEFT JOIN fabric_categories fc ON f.category_id = fc.category_id
      WHERE f.is_available = TRUE AND f.is_active = TRUE
    `;

    const connection = await db.getConnection();
    const [results] = await connection.execute(query);
    connection.release();

    res.json(results);
  } catch (error) {
    console.error('Error fetching fabrics:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/fabrics/:id', async (req, res) => {
  try {
    const fabricId = req.params.id;

    const query = 'SELECT * FROM fabrics WHERE fabric_id = ? AND is_available = TRUE';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [fabricId]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ error: 'Fabric not found' });
    }

    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM fabric_categories';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:type', async (req, res) => {
  try {
    const productType = req.params.type;

    const query = `
      SELECT pt.*, f.*, co.option_id, co.type as option_type, co.name as option_name, co.additional_cost
      FROM product_types pt
      LEFT JOIN order_items oi ON pt.type_id = oi.product_type_id
      LEFT JOIN fabrics f ON oi.fabric_id = f.fabric_id
      LEFT JOIN customization_options co ON co.type = pt.name
      WHERE pt.name = ?
    `;

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [productType]);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/customizations', async (req, res) => {
  try {
    const query = 'SELECT * FROM customization_options';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT sc.*, f.name as fabric_name, f.price as fabric_price, 
             pt.name as product_type_name, f.image_url,
             sc.total_price, sc.customization_details
      FROM shopping_cart sc
      LEFT JOIN fabrics f ON sc.fabric_id = f.fabric_id
      LEFT JOIN product_types pt ON sc.product_type_id = pt.type_id
      WHERE sc.user_id = ?
    `;

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [userId]);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fabric_id, product_type_id, quantity, customization_details, total_price } = req.body;

    const query = `
      INSERT INTO shopping_cart (user_id, fabric_id, product_type_id, quantity, customization_details, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const connection = await db.getConnection();
    const [result] = await connection.execute(query, [
      userId, 
      fabric_id, 
      product_type_id || null, 
      quantity || 1, 
      customization_details ? JSON.stringify(customization_details) : null,
      total_price || null
    ]);
    connection.release();

    res.status(201).json({ message: 'Item added to cart', cartId: result.insertId });
  } catch (error) {
    console.error('[CART] Error adding to cart:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const cartId = req.params.id;
    const userId = req.user.userId;

    const query = 'DELETE FROM shopping_cart WHERE cart_id = ? AND user_id = ?';

    const connection = await db.getConnection();
    const [result] = await connection.execute(query, [cartId, userId]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { order_number, total_amount, shipping_address, billing_address, notes, items } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const orderQuery = `
        INSERT INTO orders (user_id, order_number, total_amount, shipping_address, billing_address, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [orderResult] = await connection.execute(orderQuery, [userId, order_number, total_amount, shipping_address, billing_address, notes]);
      const orderId = orderResult.insertId;

      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, fabric_id, product_type_id, quantity, unit_price, total_price, customization_details)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const totalPrice = item.unit_price * item.quantity;

        await connection.execute(itemQuery, [
          orderId,
          item.fabric_id,
          item.product_type_id,
          item.quantity,
          item.unit_price,
          totalPrice,
          JSON.stringify(item.customization_details)
        ]);
      }

      await connection.commit();

      const trackingQuery = `
        INSERT INTO order_tracking (order_id, status, notes)
        VALUES (?, 'order_placed', 'Order placed successfully')
      `;

      await connection.execute(trackingQuery, [orderId]);
      connection.release();

      res.status(201).json({
        message: 'Order created successfully',
        orderId: orderId,
        orderNumber: order_number
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [userId]);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;

    const query = `
      SELECT o.*, oi.*, f.name as fabric_name, pt.name as product_type_name
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN fabrics f ON oi.fabric_id = f.fabric_id
      LEFT JOIN product_types pt ON oi.product_type_id = pt.type_id
      WHERE o.order_id = ? AND o.user_id = ?
    `;

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [orderId, userId]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = {
      ...results[0],
      items: results.map(item => ({
        item_id: item.item_id,
        fabric_id: item.fabric_id,
        product_type_id: item.product_type_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        customization_details: item.customization_details,
        fabric_name: item.fabric_name,
        product_type_name: item.product_type_name
      }))
    };

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

const bookingOtpStore = new Map();

const generateBookingOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/api/booking/send-otp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const connection = await db.getConnection();
    const [userResults] = await connection.execute(
      'SELECT email, username, first_name FROM users WHERE user_id = ?',
      [userId]
    );

    if (userResults.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResults[0];
    const email = user.email;

    if (!email) {
      connection.release();
      return res.status(400).json({ error: 'No email address found for your account' });
    }

    const otp = generateBookingOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const otpKey = `${userId}_booking`;
    bookingOtpStore.set(otpKey, { 
      otp, 
      expiresAt, 
      email: email,
      verified: false 
    });

    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS booking_otps (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(6) NOT NULL,
          is_verified BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      await connection.execute(
        'INSERT INTO booking_otps (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, FROM_UNIXTIME(? / 1000))',
        [userId, email, otp, expiresAt]
      );
    } finally {
      connection.release();
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: email,
      subject: 'INDULGE - Booking Verification OTP',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%); padding: 30px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 4px; font-weight: 600;">INDULGE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">BESPOKE TAILORING</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin: 0 0 20px; font-size: 24px;">Booking Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              Hello ${user.first_name || user.username || 'Valued Customer'},<br><br>
              You are booking a <strong>Home Measurement Appointment</strong> with INDULGE. 
              Please use the following OTP to verify your booking:
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); border: 2px solid #D4AF37; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #888; font-size: 14px; margin: 0 0 10px; letter-spacing: 1px;">YOUR VERIFICATION CODE</p>
              <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #5D4037; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0;">This code expires in <strong>10 minutes</strong></p>
            </div>
            
            <div style="background: #FFF8E1; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0;">
              <p style="color: #5D4037; margin: 0; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. 
                INDULGE staff will never ask for your OTP.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you did not request this booking, please ignore this email or contact our support team.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} INDULGE Bespoke Tailoring. All rights reserved.
            </p>
            <p style="color: #bbb; font-size: 11px; margin: 10px 0 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({ 
      success: true,
      message: 'OTP sent to your email',
      email: maskedEmail,
      expiresIn: 600
    });

  } catch (error) {
    console.error('[BOOKING OTP] Send error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

app.post('/api/booking/verify-otp', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const otpKey = `${userId}_booking`;
    const storedData = bookingOtpStore.get(otpKey);

    if (!storedData) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    if (Date.now() > storedData.expiresAt) {
      bookingOtpStore.delete(otpKey);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    storedData.verified = true;
    bookingOtpStore.set(otpKey, storedData);

    const connection = await db.getConnection();
    try {
      await connection.execute(
        'UPDATE booking_otps SET is_verified = TRUE WHERE user_id = ? AND otp_code = ? ORDER BY created_at DESC LIMIT 1',
        [userId, otp]
      );
    } finally {
      connection.release();
    }

    res.json({ 
      success: true,
      message: 'Email verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('[BOOKING OTP] Verify error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, time, skipOtpVerification } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const otpKey = `${userId}_booking`;

    const storedData = bookingOtpStore.get(otpKey);
    if (!skipOtpVerification && (!storedData || !storedData.verified)) {
      return res.status(400).json({ error: 'Please verify your email with OTP first' });
    }

    const connection = await db.getConnection();

    const [userResults] = await connection.execute(
      'SELECT username, email, phone, address FROM users WHERE user_id = ?',
      [userId]
    );

    const user = userResults[0] || {};

    const insertQuery = `
      INSERT INTO bookings 
      (user_id, booking_date, booking_time, status, customer_name, customer_email, customer_phone, customer_address, notes) 
      VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, 'Email verified via OTP')
    `;

    const values = [
      userId,
      date,
      time,
      user.username || 'Customer',
      user.email || '',
      user.phone || '',
      user.address || ''
    ];

    const [result] = await connection.execute(insertQuery, values);
    connection.release();

    bookingOtpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'Booking confirmed successfully! We will contact you shortly.',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('[BOOKING] Error:', error);
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const connection = await db.getConnection();
    const [results] = await connection.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_id DESC',
      [userId]
    );
    connection.release();

    res.json(results);
  } catch (error) {
    console.error('[BOOKING] Get error:', error);
    res.status(500).json({ error: 'Failed to get bookings: ' + error.message });
  }
});

app.post('/api/booking/send-confirmation', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, time, address } = req.body;

    const connection = await db.getConnection();
    const [userResults] = await connection.execute(
      'SELECT email, username, first_name FROM users WHERE user_id = ?',
      [userId]
    );
    connection.release();

    if (userResults.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResults[0];
    const email = user.email;

    if (!email) {
      return res.status(400).json({ error: 'No email address found' });
    }

    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const timeSlots = {
      morning: 'Morning (9 AM - 12 PM)',
      afternoon: 'Afternoon (12 PM - 4 PM)',
      evening: 'Evening (4 PM - 8 PM)'
    };
    const formattedTime = timeSlots[time] || time;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'INDULGE <noreply@indulge.com>',
      to: email,
      subject: 'INDULGE - Booking Confirmed!',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%); padding: 30px; text-align: center;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 4px; font-weight: 600;">INDULGE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 12px; letter-spacing: 2px;">BESPOKE TAILORING</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50 0%, #388e3c 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: white;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #333; margin: 0 0 20px; font-size: 28px; text-align: center;">Booking Confirmed!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
              Hello ${user.first_name || user.username || 'Valued Customer'},<br><br>
              Your home measurement appointment has been successfully booked!
            </p>
            
            <!-- Booking Details Card -->
            <div style="background: linear-gradient(135deg, #f8f5f3 0%, #f0ebe7 100%); border: 2px solid #D4AF37; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #5D4037; margin: 0 0 20px; font-size: 18px; border-bottom: 1px solid #e0d5c9; padding-bottom: 15px;">📅 Appointment Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #888; font-size: 14px; padding: 8px 0; width: 40%;">Date:</td>
                  <td style="color: #333; font-size: 14px; padding: 8px 0; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 14px; padding: 8px 0;">Time:</td>
                  <td style="color: #333; font-size: 14px; padding: 8px 0; font-weight: 600;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 14px; padding: 8px 0; vertical-align: top;">Address:</td>
                  <td style="color: #333; font-size: 14px; padding: 8px 0; font-weight: 600;">${address || 'As per your profile'}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                <strong>What's Next?</strong><br>
                Our expert tailor will visit your address at the scheduled time. Please ensure someone is available to receive them.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
              Need to reschedule? Contact us at <a href="mailto:support@indulge.com" style="color: #5D4037;">support@indulge.com</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} INDULGE Bespoke Tailoring. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Confirmation email sent' });

  } catch (error) {
    console.error('[BOOKING] Confirmation email error:', error);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

app.get('/api/orders/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    const query = `
      SELECT ot.*, o.status as current_order_status
      FROM order_tracking ot
      LEFT JOIN orders o ON ot.order_id = o.order_id
      WHERE ot.order_id = ?
      ORDER BY ot.created_at ASC
    `;

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [orderId]);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/measurements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = 'SELECT * FROM measurements WHERE user_id = ?';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [userId]);
    connection.release();

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/measurements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const b = req.body;
    const neck_circumference = b.neck_circumference ?? null;
    const chest_circumference = b.chest_circumference ?? null;
    const waist_circumference = b.waist_circumference ?? null;
    const hip_circumference = b.hip_circumference ?? null;
    const shoulder_width = b.shoulder_width ?? null;
    const sleeve_length = b.sleeve_length ?? null;
    const armhole_depth = b.armhole_depth ?? null;
    const torso_length = b.torso_length ?? null;
    const inseam_length = b.inseam_length ?? null;
    const thigh_circumference = b.thigh_circumference ?? null;
    const knee_circumference = b.knee_circumference ?? null;
    const ankle_circumference = b.ankle_circumference ?? null;
    const notes = b.notes ?? null;
    const query = `
      INSERT INTO measurements (
        user_id, neck_circumference, chest_circumference, waist_circumference, hip_circumference,
        shoulder_width, sleeve_length, armhole_depth, torso_length,
        inseam_length, thigh_circumference, knee_circumference, ankle_circumference, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        neck_circumference = VALUES(neck_circumference),
        chest_circumference = VALUES(chest_circumference),
        waist_circumference = VALUES(waist_circumference),
        hip_circumference = VALUES(hip_circumference),
        shoulder_width = VALUES(shoulder_width),
        sleeve_length = VALUES(sleeve_length),
        armhole_depth = VALUES(armhole_depth),
        torso_length = VALUES(torso_length),
        inseam_length = VALUES(inseam_length),
        thigh_circumference = VALUES(thigh_circumference),
        knee_circumference = VALUES(knee_circumference),
        ankle_circumference = VALUES(ankle_circumference),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `;
    const connection = await db.getConnection();
    await connection.execute(query, [
      userId, neck_circumference, chest_circumference, waist_circumference, hip_circumference,
      shoulder_width, sleeve_length, armhole_depth, torso_length,
      inseam_length, thigh_circumference, knee_circumference, ankle_circumference, notes
    ]);
    connection.release();

    res.json({ message: 'Measurements saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = 'SELECT user_id, username, email, first_name, last_name, phone, address FROM users WHERE user_id = ?';

    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [userId]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, email, first_name, last_name, phone, address } = req.body;

    const query = `
      UPDATE users 
      SET username = ?, email = ?, first_name = ?, last_name = ?, phone = ?, address = ?
      WHERE user_id = ?
    `;

    const connection = await db.getConnection();
    const [result] = await connection.execute(query, [username, email, first_name, last_name, phone, address, userId]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

const { v4: uuidv4 } = require('uuid');

const uploads3dDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploads3dDir)) {
  fs.mkdirSync(uploads3dDir, { recursive: true });
}

app.use('/models', express.static(path.join(__dirname, '..', 'public', 'models')));
app.use('/fabrics', express.static(path.join(__dirname, '..', 'public', 'fabrics')));
app.use('/Photos', express.static(path.join(__dirname, '..', 'src', 'Photos')));
app.use('/uploads', express.static(uploads3dDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploads3dDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  }
});

app.get('/api/garments', async (req, res) => {
  try {
    const query = 'SELECT * FROM garments WHERE is_active = TRUE';
    const connection = await db.getConnection();
    const [results] = await connection.execute(query);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error fetching garments:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/garments/:id', async (req, res) => {
  try {
    const query = 'SELECT * FROM garments WHERE id = ? AND is_active = TRUE';
    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [req.params.id]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ error: 'Garment not found' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching garment:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/3d-fabrics', async (req, res) => {
  try {
    const query = `
      SELECT 
        fabric_id as id,
        name,
        COALESCE((SELECT name FROM fabric_categories WHERE category_id = f.category_id), 'general') as category,
        COALESCE(texture_url, image_url) as texture_url,
        normal_map_url,
        roughness_map_url,
        scale_x,
        scale_y,
        color_hex,
        is_active,
        created_at
      FROM fabrics f
      WHERE is_active = TRUE AND is_available = TRUE
    `;
    const connection = await db.getConnection();
    const [results] = await connection.execute(query);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error fetching 3D fabrics:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/3d-fabrics/:id', async (req, res) => {
  try {
    const query = `
      SELECT 
        fabric_id as id,
        name,
        COALESCE((SELECT name FROM fabric_categories WHERE category_id = f.category_id), 'general') as category,
        COALESCE(texture_url, image_url) as texture_url,
        normal_map_url,
        roughness_map_url,
        scale_x,
        scale_y,
        color_hex,
        is_active
      FROM fabrics f
      WHERE fabric_id = ? AND is_active = TRUE
    `;
    const connection = await db.getConnection();
    const [results] = await connection.execute(query, [req.params.id]);
    connection.release();

    if (results.length === 0) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching 3D fabric:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/configurations', async (req, res) => {
  try {
    const { session_id, garment_id, fabric_id, fabric_scale, notes } = req.body;

    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
      }
    }

    const sessionId = session_id || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!garment_id || !fabric_id) {
      return res.status(400).json({ error: 'Garment and fabric are required' });
    }

    const connection = await db.getConnection();

    const query = `
      INSERT INTO user_configurations (session_id, user_id, garment_id, fabric_id, fabric_scale, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      sessionId,
      userId,
      garment_id,
      fabric_id,
      fabric_scale || 1.0,
      notes || null
    ]);

    connection.release();

    res.status(201).json({
      success: true,
      message: 'Configuration saved successfully',
      configId: result.insertId,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('[CONFIG] Error saving configuration:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

app.get('/api/configurations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const connection = await db.getConnection();
    const [results] = await connection.execute(
      `SELECT uc.*, g.name as garment_name, g.type as garment_type, 
              f.name as fabric_name, f.texture_url, f.color_hex
       FROM user_configurations uc
       LEFT JOIN garments g ON uc.garment_id = g.id
       LEFT JOIN fabrics f ON uc.fabric_id = f.fabric_id
       WHERE uc.user_id = ?
       ORDER BY uc.saved_at DESC`,
      [userId]
    );
    connection.release();

    res.json(results);
  } catch (error) {
    console.error('[CONFIG] Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

app.delete('/api/configurations/:id', authenticateToken, async (req, res) => {
  try {
    const configId = req.params.id;
    const userId = req.user.userId;

    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM user_configurations WHERE id = ? AND user_id = ?',
      [configId, userId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('[CONFIG] Error deleting configuration:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'unified', timestamp: new Date().toISOString() });
});

app.get('/api/orders/:orderId/tracking', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const [orders] = await connection.execute(
      'SELECT order_id, order_number, status, created_at, updated_at FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    const [trackingHistory] = await connection.execute(
      `SELECT tracking_id, status, location, notes, created_at 
       FROM order_tracking 
       WHERE order_id = ? 
       ORDER BY created_at ASC`,
      [orderId]
    );

    const trackingSteps = [
      { key: 'order_placed', label: 'Order Placed', description: 'Your order has been confirmed' },
      { key: 'payment_confirmed', label: 'Payment Confirmed', description: 'Payment has been received' },
      { key: 'measurement_scheduled', label: 'Measurement Scheduled', description: 'Home measurement appointment scheduled' },
      { key: 'measurements_taken', label: 'Measurements Taken', description: 'Your measurements have been recorded' },
      { key: 'design_approved', label: 'Design Approved', description: 'Your garment design is finalized' },
      { key: 'production_started', label: 'In Production', description: 'Your garment is being crafted' },
      { key: 'quality_check', label: 'Quality Check', description: 'Final inspection and quality assurance' },
      { key: 'packaging', label: 'Packaging', description: 'Your order is being packaged' },
      { key: 'shipped', label: 'Shipped', description: 'Your order has been dispatched' },
      { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is on its way' },
      { key: 'delivered', label: 'Delivered', description: 'Order successfully delivered' }
    ];

    const completedSteps = new Set(trackingHistory.map(t => t.status));
    
    let currentStepIndex = -1;
    for (let i = trackingSteps.length - 1; i >= 0; i--) {
      if (completedSteps.has(trackingSteps[i].key)) {
        currentStepIndex = i;
        break;
      }
    }

    const timeline = trackingSteps.map((step, index) => {
      const historyEntry = trackingHistory.find(t => t.status === step.key);
      let status = 'pending';
      
      if (historyEntry) {
        status = index === currentStepIndex ? 'active' : 'completed';
      }

      return {
        ...step,
        status,
        date: historyEntry ? historyEntry.created_at : null,
        location: historyEntry ? historyEntry.location : null,
        notes: historyEntry ? historyEntry.notes : null
      };
    });

    res.json({
      order: {
        orderId: order.order_id,
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      },
      timeline,
      currentStep: currentStepIndex >= 0 ? trackingSteps[currentStepIndex].label : 'Processing'
    });

  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ error: 'Failed to get order tracking' });
  } finally {
    connection.release();
  }
});

const authenticateEmployee = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.employeeId) {
      return res.status(403).json({ error: 'Invalid employee token' });
    }
    req.employee = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.employee.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.post('/api/employee/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await db.getConnection();
    const [employees] = await connection.execute(
      'SELECT * FROM employees WHERE email = ? AND is_active = TRUE',
      [email]
    );
    connection.release();

    if (employees.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const employee = employees[0];
    const isValid = await bcrypt.compare(password, employee.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const conn2 = await db.getConnection();
    await conn2.execute(
      'UPDATE employees SET last_login = NOW() WHERE employee_id = ?',
      [employee.employee_id]
    );
    conn2.release();

    const token = jwt.sign(
      { employeeId: employee.employee_id, role: employee.role, email: employee.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      employee: {
        employee_id: employee.employee_id,
        username: employee.username,
        email: employee.email,
        first_name: employee.first_name,
        last_name: employee.last_name,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/dashboard/stats', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    const [revenueResult] = await connection.execute('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != "cancelled"');
    const [ordersResult] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    const [bookingsResult] = await connection.execute('SELECT COUNT(*) as total FROM bookings');
    const [usersResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
    
    connection.release();

    res.json({
      totalRevenue: revenueResult[0].total || 0,
      totalOrders: ordersResult[0].total || 0,
      totalBookings: bookingsResult[0].total || 0,
      totalUsers: usersResult[0].total || 0,
      revenueChange: 12.5,
      ordersChange: 8.3,
      bookingsChange: -2.1,
      usersChange: 15.7
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/fabrics', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [fabrics] = await connection.execute('SELECT * FROM fabrics ORDER BY fabric_id DESC');
    connection.release();
    res.json(fabrics);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employee/fabrics', authenticateEmployee, async (req, res) => {
  const { name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available } = req.body;
  try {
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO fabrics (name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available ?? true]
    );
    connection.release();
    res.json({ fabric_id: result.insertId, message: 'Fabric created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/fabrics/:id', authenticateEmployee, async (req, res) => {
  const { name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available } = req.body;
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'UPDATE fabrics SET name=?, description=?, category_id=?, composition=?, weight=?, price=?, stock_quantity=?, image_url=?, texture_url=?, color_hex=?, is_available=? WHERE fabric_id=?',
      [name, description, category_id, composition, weight, price, stock_quantity, image_url, texture_url, color_hex, is_available, req.params.id]
    );
    connection.release();
    res.json({ message: 'Fabric updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/fabrics/:id', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM fabrics WHERE fabric_id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Fabric deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/orders', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [orders] = await connection.execute(
      `SELECT o.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as user_name 
       FROM orders o LEFT JOIN users u ON o.user_id = u.user_id ORDER BY o.order_id DESC`
    );
    connection.release();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/orders/:id', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const orderId = req.params.id;
    
    const [orders] = await connection.execute(
      `SELECT o.*, 
              u.first_name, u.last_name, u.email, u.phone, u.address as user_address,
              CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.user_id 
       WHERE o.order_id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    
    const [items] = await connection.execute(
      `SELECT oi.*, 
              f.name as fabric_name, f.description as fabric_description, 
              f.composition, f.weight, f.color_hex,
              pt.name as product_type_name
       FROM order_items oi
       LEFT JOIN fabrics f ON oi.fabric_id = f.fabric_id
       LEFT JOIN product_types pt ON oi.product_type_id = pt.type_id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    
    let measurements = null;
    if (order.user_id) {
      const [measurementRows] = await connection.execute(
        `SELECT * FROM measurements WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
        [order.user_id]
      );
      if (measurementRows.length > 0) {
        measurements = measurementRows[0];
      }
    }
    
    connection.release();
    
    const parsedItems = items.map(item => ({
      ...item,
      customization_details: item.customization_details 
        ? (typeof item.customization_details === 'string' 
            ? JSON.parse(item.customization_details) 
            : item.customization_details)
        : null
    }));
    
    res.json({
      order,
      items: parsedItems,
      measurements
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/orders/:id/status', authenticateEmployee, async (req, res) => {
  try {
    // Block delivery boys from using generic status update
    if (req.employee.role === 'delivery_boy') {
      return res.status(403).json({ error: 'Delivery boys must use the OTP delivery flow to update orders.' });
    }

    const connection = await db.getConnection();
    const orderId = req.params.id;
    const newStatus = req.body.status;
    
    const [currentOrder] = await connection.execute(
      'SELECT status FROM orders WHERE order_id = ?',
      [orderId]
    );
    
    if (currentOrder.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const currentStatus = currentOrder[0].status;
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      connection.release();
      const statusLabel = currentStatus === 'delivered' ? 'delivered' : 'cancelled';
      return res.status(400).json({ 
        error: `Cannot modify ${statusLabel} orders`,
        message: `This order has been ${statusLabel} and cannot be changed.`
      });
    }
    
    await connection.execute('UPDATE orders SET status = ? WHERE order_id = ?', [newStatus, orderId]);

    // Fetch user email, order number, and total for tracking email
    let trackEmail = null;
    let trackOrderNumber = null;
    let trackTotal = null;
    try {
      const [orderInfo] = await connection.execute(
        'SELECT o.order_number, o.total_amount, u.email FROM orders o JOIN users u ON o.user_id = u.user_id WHERE o.order_id = ?',
        [orderId]
      );
      if (orderInfo.length > 0) {
        trackEmail = orderInfo[0].email;
        trackOrderNumber = orderInfo[0].order_number;
        trackTotal = orderInfo[0].total_amount;
      }
    } catch (e) { /* ignore */ }

    connection.release();

    // Fire-and-forget: send tracking update email
    if (trackEmail && trackOrderNumber) {
      sendTrackingUpdateEmail(trackEmail, trackOrderNumber, newStatus, trackTotal).catch(() => {});
    }

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== DELIVERY BOY OTP ROUTES =====================
const deliveryOtpStore = new Map();

// Send OTP to customer for delivery verification
app.post('/api/employee/delivery/send-otp', authenticateEmployee, async (req, res) => {
  try {
    if (req.employee.role !== 'delivery_boy' && req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Only delivery boys can use this route' });
    }

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Order ID is required' });

    const connection = await db.getConnection();

    // Check order is shipped
    const [orders] = await connection.execute(
      `SELECT o.order_id, o.order_number, o.status, o.user_id, u.email, u.first_name 
       FROM orders o JOIN users u ON o.user_id = u.user_id 
       WHERE o.order_id = ?`,
      [orderId]
    );
    connection.release();

    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orders[0];
    if (order.status !== 'shipped') {
      return res.status(400).json({ error: `Order is '${order.status}', not shipped. Cannot deliver.` });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    deliveryOtpStore.set(`delivery_${orderId}`, { otp, expiresAt, customerEmail: order.email });

    // Send OTP email to customer
    const body = `
      <div style="padding: 30px 24px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 8px;">Delivery Verification</h2>
        <p style="color: #666; font-size: 14px;">Hi ${order.first_name || 'Customer'},</p>
        <p style="color: #666; font-size: 14px;">Your order <strong>#${order.order_number}</strong> is being delivered. Please share this code with the delivery person:</p>
        <div style="background: linear-gradient(135deg, #1a1210 0%, #2c1f1a 100%); padding: 20px; border-radius: 12px; margin: 20px auto; max-width: 200px;">
          <span style="color: #d4af37; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"INDULGE" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Delivery OTP for Order #${order.order_number}`,
      html: emailWrapper(body)
    });

    console.log(`[DELIVERY] OTP sent to ${order.email} for order #${order.order_number}`);
    res.json({ message: 'OTP sent to customer', maskedEmail: order.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
  } catch (error) {
    console.error('Delivery send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and mark order as delivered
app.post('/api/employee/delivery/verify-otp', authenticateEmployee, async (req, res) => {
  try {
    if (req.employee.role !== 'delivery_boy' && req.employee.role !== 'admin') {
      return res.status(403).json({ error: 'Only delivery boys can use this route' });
    }

    const { orderId, otp } = req.body;
    if (!orderId || !otp) return res.status(400).json({ error: 'Order ID and OTP are required' });

    const storedData = deliveryOtpStore.get(`delivery_${orderId}`);
    if (!storedData) return res.status(400).json({ error: 'No OTP found. Please send OTP first.' });
    if (Date.now() > storedData.expiresAt) {
      deliveryOtpStore.delete(`delivery_${orderId}`);
      return res.status(400).json({ error: 'OTP has expired. Please send a new one.' });
    }
    if (storedData.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    deliveryOtpStore.delete(`delivery_${orderId}`);

    const connection = await db.getConnection();

    // Verify order is still shipped
    const [orders] = await connection.execute('SELECT status, order_number, total_amount, user_id FROM orders WHERE order_id = ?', [orderId]);
    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    if (orders[0].status !== 'shipped') {
      connection.release();
      return res.status(400).json({ error: 'Order is no longer in shipped status' });
    }

    await connection.execute('UPDATE orders SET status = ? WHERE order_id = ?', ['delivered', orderId]);

    // Send tracking email
    try {
      const [userInfo] = await connection.execute('SELECT email FROM users WHERE user_id = ?', [orders[0].user_id]);
      if (userInfo.length > 0) {
        sendTrackingUpdateEmail(userInfo[0].email, orders[0].order_number, 'delivered', orders[0].total_amount).catch(() => {});
      }
    } catch (e) { /* ignore */ }

    connection.release();
    console.log(`[DELIVERY] Order #${orders[0].order_number} marked as delivered by employee ${req.employee.employeeId}`);
    res.json({ message: 'Order delivered successfully!' });
  } catch (error) {
    console.error('Delivery verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify delivery' });
  }
});

app.get('/api/employee/bookings', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [bookings] = await connection.execute('SELECT * FROM bookings ORDER BY booking_id DESC');
    connection.release();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/bookings/:id/status', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('UPDATE bookings SET status = ? WHERE booking_id = ?', [req.body.status, req.params.id]);
    connection.release();
    res.json({ message: 'Booking status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/bookings/:id', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM bookings WHERE booking_id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/users', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [users] = await connection.execute('SELECT user_id, username, email, first_name, last_name, phone, is_active, created_at FROM users ORDER BY user_id DESC');
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/users/:id/toggle-active', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('UPDATE users SET is_active = NOT is_active WHERE user_id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'User status toggled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/measurements', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [measurements] = await connection.execute(
      `SELECT m.*, u.first_name, u.last_name, u.email, CONCAT(u.first_name, ' ', u.last_name) as user_name 
       FROM measurements m LEFT JOIN users u ON m.user_id = u.user_id ORDER BY m.updated_at DESC`
    );
    connection.release();
    res.json(measurements);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/payments', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [payments] = await connection.execute(
      `SELECT p.*, o.order_number, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as user_name 
       FROM payments p 
       LEFT JOIN orders o ON p.order_id = o.order_id 
       LEFT JOIN users u ON p.user_id = u.user_id 
       ORDER BY p.payment_id DESC`
    );
    connection.release();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employee/payments', authenticateEmployee, async (req, res) => {
  const { order_id, user_id, amount, payment_method, transaction_id, status, notes } = req.body;
  try {
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order_id, user_id, amount, payment_method, transaction_id, status || 'completed', notes]
    );
    connection.release();
    res.json({ payment_id: result.insertId, message: 'Payment created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/payments/:id/status', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('UPDATE payments SET status = ? WHERE payment_id = ?', [req.body.status, req.params.id]);
    connection.release();
    res.json({ message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/cancellations', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [cancellations] = await connection.execute(
      `SELECT oc.*, 
              o.order_number, o.total_amount as order_total, o.status as order_status,
              u.first_name, u.last_name, u.email, u.phone,
              CONCAT(u.first_name, ' ', u.last_name) as user_name
       FROM order_cancellations oc
       LEFT JOIN orders o ON oc.order_id = o.order_id
       LEFT JOIN users u ON oc.user_id = u.user_id
       ORDER BY oc.cancelled_at DESC`
    );
    connection.release();
    res.json(cancellations);
  } catch (error) {
    console.error('Get cancellations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/cancellations/:id/status', authenticateEmployee, async (req, res) => {
  try {
    const { refund_status, employee_notes } = req.body;
    const cancellationId = req.params.id;
    
    const connection = await db.getConnection();
    
    const processedAt = (refund_status === 'completed' || refund_status === 'rejected') ? new Date() : null;
    
    await connection.execute(
      `UPDATE order_cancellations 
       SET refund_status = ?, employee_notes = ?, processed_at = ?
       WHERE cancellation_id = ?`,
      [refund_status, employee_notes || null, processedAt, cancellationId]
    );
    // Send refund email when refund status is completed or rejected
    if (refund_status === 'completed' || refund_status === 'rejected') {
      try {
        const [cancelInfo] = await connection.execute(
          `SELECT oc.order_id, oc.refund_amount, oc.refund_method, oc.payment_method, 
                  o.order_number, o.total_amount, u.email 
           FROM order_cancellations oc 
           JOIN orders o ON oc.order_id = o.order_id 
           JOIN users u ON oc.user_id = u.user_id 
           WHERE oc.cancellation_id = ?`,
          [cancellationId]
        );
        if (cancelInfo.length > 0) {
          const ci = cancelInfo[0];
          sendRefundProcessedEmail(ci.email, ci.order_number, {
            refundAmount: ci.refund_amount || ci.total_amount,
            refundMethod: ci.refund_method,
            refundStatus: refund_status
          }).catch(() => {});
        }
      } catch (e) { /* ignore */ }
    }

    connection.release();
    
    res.json({ message: 'Cancellation status updated' });
  } catch (error) {
    console.error('Update cancellation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/returns', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [returns] = await connection.execute(`
      SELECT r.*, o.order_number, o.total_amount as order_amount,
             u.username as user_name, u.email, u.phone
      FROM order_returns r
      JOIN orders o ON r.order_id = o.order_id
      JOIN users u ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
    `);
    connection.release();

    const parsed = returns.map(r => {
      if (r.damage_photos && typeof r.damage_photos === 'string') {
        try { r.damage_photos = JSON.parse(r.damage_photos); } catch { r.damage_photos = []; }
      }
      return r;
    });

    res.json(parsed);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/returns/:id/status', authenticateEmployee, async (req, res) => {
  try {
    const { pickup_status, refund_status, employee_notes } = req.body;
    const returnId = req.params.id;
    const connection = await db.getConnection();

    const processedAt = (pickup_status === 'refunded' || pickup_status === 'exchanged') ? new Date() : null;

    await connection.execute(
      `UPDATE order_returns
       SET pickup_status = COALESCE(?, pickup_status),
           refund_status = COALESCE(?, refund_status),
           employee_notes = COALESCE(?, employee_notes),
           processed_at = COALESCE(?, processed_at)
       WHERE return_id = ?`,
      [pickup_status || null, refund_status || null, employee_notes || null, processedAt, returnId]
    );
    connection.release();

    res.json({ message: 'Return status updated' });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/models', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [models] = await connection.execute('SELECT * FROM garments ORDER BY id DESC');
    connection.release();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employee/models', authenticateEmployee, async (req, res) => {
  const { name, type, description, model_url, thumbnail_url, is_active } = req.body;
  try {
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO garments (name, type, description, model_url, thumbnail_url, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, description, model_url, thumbnail_url, is_active ?? true]
    );
    connection.release();
    res.json({ id: result.insertId, message: 'Model created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/models/:id', authenticateEmployee, async (req, res) => {
  const { name, type, description, model_url, thumbnail_url, is_active } = req.body;
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'UPDATE garments SET name=?, type=?, description=?, model_url=?, thumbnail_url=?, is_active=? WHERE id=?',
      [name, type, description, model_url, thumbnail_url, is_active, req.params.id]
    );
    connection.release();
    res.json({ message: 'Model updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/models/:id', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM garments WHERE id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Model deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/coupons', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [coupons] = await connection.execute('SELECT * FROM coupons ORDER BY coupon_id DESC');
    connection.release();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employee/coupons', authenticateEmployee, async (req, res) => {
  const { code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active } = req.body;
  try {
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active ?? true]
    );
    connection.release();
    res.json({ coupon_id: result.insertId, message: 'Coupon created' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/employee/coupons/:id', authenticateEmployee, async (req, res) => {
  const { code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active } = req.body;
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'UPDATE coupons SET code=?, discount_type=?, discount_value=?, min_order_amount=?, max_discount_amount=?, usage_limit=?, start_date=?, end_date=?, is_active=? WHERE coupon_id=?',
      [code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, start_date, end_date, is_active, req.params.id]
    );
    connection.release();
    res.json({ message: 'Coupon updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/coupons/:id', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM coupons WHERE coupon_id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/employees', authenticateEmployee, requireAdmin, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [employees] = await connection.execute('SELECT employee_id, username, email, first_name, last_name, role, phone, is_active, last_login, created_at FROM employees ORDER BY employee_id');
    connection.release();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/employee/employees', authenticateEmployee, requireAdmin, async (req, res) => {
  const { username, email, password, first_name, last_name, role, phone } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO employees (username, email, password_hash, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, first_name, last_name, role || 'employee', phone || null]
    );
    connection.release();
    res.json({ employee_id: result.insertId, message: 'Employee created' });
  } catch (error) {
    console.error('[EMPLOYEE CREATE] Error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'An employee with that username or email already exists' });
    }
    if (error.code === 'ER_NO_SUCH_TABLE') {
      try {
        const connection = await db.getConnection();
        await connection.execute(`
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
            created_by INT
          )
        `);
        const password_hash2 = await bcrypt.hash(password, 10);
        const [result2] = await connection.execute(
          'INSERT INTO employees (username, email, password_hash, first_name, last_name, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [username, email, password_hash2, first_name, last_name, role || 'employee', phone || null]
        );
        connection.release();
        return res.json({ employee_id: result2.insertId, message: 'Employee created (table was auto-created)' });
      } catch (retryErr) {
        console.error('[EMPLOYEE CREATE] Retry error:', retryErr.message);
        return res.status(500).json({ error: retryErr.message });
      }
    }
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.put('/api/employee/employees/:id', authenticateEmployee, requireAdmin, async (req, res) => {
  const { username, email, password, first_name, last_name, role, phone, is_active } = req.body;
  try {
    const connection = await db.getConnection();
    
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await connection.execute(
        'UPDATE employees SET username=?, email=?, password_hash=?, first_name=?, last_name=?, role=?, phone=?, is_active=? WHERE employee_id=?',
        [username, email, password_hash, first_name, last_name, role, phone, is_active, req.params.id]
      );
    } else {
      await connection.execute(
        'UPDATE employees SET username=?, email=?, first_name=?, last_name=?, role=?, phone=?, is_active=? WHERE employee_id=?',
        [username, email, first_name, last_name, role, phone, is_active, req.params.id]
      );
    }
    
    connection.release();
    res.json({ message: 'Employee updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/employees/:id', authenticateEmployee, requireAdmin, async (req, res) => {
  try {
    const connection = await db.getConnection();
    
    const [emp] = await connection.execute('SELECT role FROM employees WHERE employee_id = ?', [req.params.id]);
    if (emp.length > 0 && emp[0].role === 'admin') {
      connection.release();
      return res.status(403).json({ error: 'Cannot delete admin account' });
    }
    
    await connection.execute('DELETE FROM employees WHERE employee_id = ?', [req.params.id]);
    connection.release();
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/categories', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [categories] = await connection.execute('SELECT * FROM fabric_categories');
    connection.release();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/orders/:orderId/tracking', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const userId = req.user.userId;
    const orderId = req.params.orderId;
    
    const [orders] = await connection.execute(
      `SELECT o.*, u.firstName, u.lastName 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.order_id = ? AND o.user_id = ?`,
      [orderId, userId]
    );
    
    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[0];
    const currentStatus = order.status || 'pending';
    const statusUpdatedAt = order.status_updated_at || order.updated_at || order.created_at;
    
    const statusOrder = ['pending', 'processing', 'in_production', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus.toLowerCase());
    
    const timeline = [
      {
        key: 'order_placed',
        label: 'Order Placed',
        description: 'Your order has been confirmed',
        status: currentIndex >= 0 ? 'completed' : 'pending',
        date: order.created_at
      },
      {
        key: 'processing',
        label: 'Processing',
        description: 'Your order is being processed',
        status: currentIndex >= 1 ? 'completed' : (currentIndex === 0 ? 'current' : 'pending'),
        date: currentIndex >= 1 ? statusUpdatedAt : null
      },
      {
        key: 'in_production',
        label: 'In Production',
        description: 'Your garment is being crafted',
        status: currentIndex >= 2 ? 'completed' : (currentIndex === 1 ? 'current' : 'pending'),
        date: currentIndex >= 2 ? statusUpdatedAt : null
      },
      {
        key: 'shipped',
        label: 'Shipped',
        description: 'Your order has been dispatched',
        status: currentIndex >= 3 ? 'completed' : (currentIndex === 2 ? 'current' : 'pending'),
        date: currentIndex >= 3 ? statusUpdatedAt : null
      },
      {
        key: 'delivered',
        label: 'Delivered',
        description: 'Your order has been delivered',
        status: currentIndex >= 4 ? 'completed' : (currentIndex === 3 ? 'current' : 'pending'),
        date: currentIndex >= 4 ? statusUpdatedAt : null
      }
    ];
    
    const currentStepMap = {
      'pending': 'Order Placed',
      'processing': 'Processing',
      'in_production': 'In Production',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    connection.release();
    
    res.json({
      order: {
        orderId: order.order_id,
        orderNumber: order.order_number,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      },
      currentStep: currentStepMap[currentStatus.toLowerCase()] || currentStatus,
      timeline: currentStatus === 'cancelled' ? [{
        key: 'cancelled',
        label: 'Order Cancelled',
        description: 'This order has been cancelled',
        status: 'completed',
        date: statusUpdatedAt
      }] : timeline
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/reviews/:fabricId', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [reviews] = await connection.execute(
      `SELECT r.review_id, r.rating, r.review_text, r.created_at, r.updated_at,
              r.user_id, u.first_name, u.last_name, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.fabric_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.fabricId]
    );

    const [avgResult] = await connection.execute(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE fabric_id = ?`,
      [req.params.fabricId]
    );
    connection.release();

    res.json({
      reviews,
      avgRating: parseFloat(avgResult[0].avg_rating) || 0,
      totalReviews: parseInt(avgResult[0].total_reviews) || 0
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reviews', reviewLimiter, authenticateToken, async (req, res) => {
  try {
    const { fabric_id, rating, review_text } = req.body;
    const user_id = req.user.userId;
    const cleanText = review_text ? sanitize(review_text) : null;

    if (!fabric_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'fabric_id and rating (1-5) are required' });
    }

    const connection = await db.getConnection();
    await connection.execute(
      `INSERT INTO reviews (fabric_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text), updated_at = CURRENT_TIMESTAMP`,
      [fabric_id, user_id, rating, cleanText]
    );
    connection.release();

    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'DELETE FROM reviews WHERE review_id = ? AND user_id = ?',
      [req.params.reviewId, req.user.userId]
    );
    connection.release();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/employee/reviews', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [reviews] = await connection.execute(
      `SELECT r.review_id, r.fabric_id, r.user_id, r.rating, r.review_text, r.created_at, r.updated_at,
              u.first_name, u.last_name, u.username, u.email,
              f.name as fabric_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN fabrics f ON r.fabric_id = f.fabric_id
       ORDER BY r.created_at DESC`
    );
    connection.release();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/employee/reviews/:reviewId', authenticateEmployee, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM reviews WHERE review_id = ?', [req.params.reviewId]);
    connection.release();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

(async () => {
  try {
    const connection = await db.getConnection();
    await connection.execute(`
      ALTER TABLE payment_methods 
      ADD COLUMN IF NOT EXISTS method_type ENUM('card','upi') DEFAULT 'card' AFTER user_id,
      ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100) AFTER cardholder_name
    `).catch(() => {});
    connection.release();
  } catch (e) {}
})();

app.get('/api/razorpay-key', authenticateToken, (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post('/api/payments/create-order', authenticateToken, paymentLimiter, validatePaymentInput, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('[RAZORPAY] Create order error:', maskSensitive(error));
    res.status(500).json({ error: 'Payment gateway error' });
  }
});

app.post('/api/payments/verify', authenticateToken, paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    const connection = await db.getConnection();
    await connection.execute(
      `UPDATE payments SET status = 'completed', transaction_id = ?, notes = CONCAT(IFNULL(notes,''), ' | Razorpay: ', ?) WHERE order_id = ? AND user_id = ?`,
      [razorpay_payment_id, razorpay_order_id, order_id, req.user.userId]
    );
    await connection.execute(
      `UPDATE orders SET status = 'processing' WHERE order_id = ? AND user_id = ?`,
      [order_id, req.user.userId]
    );
    connection.release();
    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('[RAZORPAY] Verify error:', maskSensitive(error));
    res.status(500).json({ error: 'Payment verification error' });
  }
});

app.get('/api/payment-methods', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.userId]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('[PAYMENT] Get methods error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/payment-methods', authenticateToken, paymentLimiter, validatePaymentInput, async (req, res) => {
  try {
    const b = req.body;
    const connection = await db.getConnection();
    if (b.method_type === 'upi') {
      await connection.execute(
        'INSERT INTO payment_methods (user_id, method_type, upi_id) VALUES (?, ?, ?)',
        [req.user.userId, 'upi', b.upi_id]
      );
    } else {
      const masked = b.card_number ? '****' + b.card_number.slice(-4) : null;
      await connection.execute(
        'INSERT INTO payment_methods (user_id, method_type, card_number, card_type, expiry_month, expiry_year, cardholder_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.userId, 'card', masked, b.card_type ?? null, b.expiry_month ?? null, b.expiry_year ?? null, b.cardholder_name ?? null]
      );
    }
    connection.release();
    res.status(201).json({ message: 'Payment method saved' });
  } catch (error) {
    console.error('[PAYMENT] Save method error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/payment-methods/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await db.getConnection();
    await connection.execute(
      'DELETE FROM payment_methods WHERE payment_id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    connection.release();
    res.json({ message: 'Payment method removed' });
  } catch (error) {
    console.error('[PAYMENT] Delete method error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
});