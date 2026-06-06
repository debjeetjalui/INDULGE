import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Phone, Mail, MapPin, X, ScrollText } from 'lucide-react';

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);

  const socialLinks = [
    { icon: <Facebook size={20} />, href: '#' },
    { icon: <Instagram size={20} />, href: '#' },
    { icon: <Twitter size={20} />, href: '#' },
    { icon: <Linkedin size={20} />, href: '#' }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li>
                <Phone size={20} />  +91 XXXXX XXXXX
              </li>
              <li>
                <Mail size={20} />  info@indulge.com
              </li>
              <li>
                <MapPin size={20} />  Your City, India
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <div class="nav-logo">
              <img src="/src/Photos/footer-logo.png" alt="INDULGE" className="footer-logo" />
            </div>
          </div>

          <div className="footer-section social-right">
            <div className="footer-social">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.href}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 INDULGE. All rights reserved.</p>
          <button className="terms-link" onClick={() => setShowTerms(true)}>
            <ScrollText size={14} />
            Terms & Conditions
          </button>
        </div>
      </div>

      {showTerms && (
        <div className="terms-modal-overlay" onClick={() => setShowTerms(false)}>
          <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <div className="terms-header-title">
                <ScrollText size={24} />
                <h2>Terms & Conditions</h2>
              </div>
              <span className="terms-brand">THE SILAI STORE</span>
              <button className="terms-close-btn" onClick={() => setShowTerms(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="terms-modal-body">
              <section className="terms-section">
                <h3>1. Acceptance of Terms</h3>
                <p>By accessing, browsing, or using the website and services of THE SILAI STORE, you agree to comply with and be bound by these Terms & Conditions. If you do not agree, please do not use our website or services.</p>
              </section>

              <section className="terms-section">
                <h3>2. Services</h3>
                <p>THE SILAI STORE offers custom tailoring and stitching services. All garments are made-to-order based on customer measurements, design preferences, and fabric selections.</p>
              </section>

              <section className="terms-section">
                <h3>3. Orders & Measurements</h3>
                <ul>
                  <li>Customers must ensure that all measurements and order details provided are accurate.</li>
                  <li>Measurements may be taken by THE SILAI STORE or shared by the customer.</li>
                  <li>Due to the handcrafted and customized nature of tailoring, minor variations in fit, finish, or appearance may occur.</li>
                  <li>Once an order is confirmed, it cannot be modified, cancelled, or transferred.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>4. Pricing & Payments</h3>
                <ul>
                  <li>All prices are listed in Indian Rupees (INR) unless stated otherwise.</li>
                  <li>Prices may change without prior notice.</li>
                  <li>Full or partial payment may be required before order processing.</li>
                  <li>THE SILAI STORE reserves the right to cancel orders in case of pricing errors, payment failure, or suspected fraud.</li>
                </ul>
              </section>

              <section className="terms-section terms-highlight">
                <h3>5. No Returns, No Refunds</h3>
                <ul>
                  <li>All products are custom-made and stitched exclusively for the customer.</li>
                  <li><strong>Returns, exchanges, or refunds are not accepted under any circumstances.</strong></li>
                  <li>Alterations, if offered, are subject to THE SILAI STORE's alteration policy and applicable timelines.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>6. Delivery & Timelines</h3>
                <ul>
                  <li>Delivery timelines provided are estimated and may vary due to customization, fabric availability, or operational factors.</li>
                  <li>THE SILAI STORE is not responsible for delays caused by third-party delivery partners or unforeseen circumstances.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>7. Intellectual Property</h3>
                <p>All content on this website—including logos, designs, images, text, graphics, and branding—belongs exclusively to THE SILAI STORE. Unauthorized use, reproduction, or distribution is strictly prohibited.</p>
              </section>

              <section className="terms-section">
                <h3>8. User Conduct</h3>
                <p>Users agree not to:</p>
                <ul>
                  <li>Provide false or misleading information</li>
                  <li>Misuse the website or services</li>
                  <li>Attempt to harm, hack, or disrupt the website</li>
                </ul>
                <p>THE SILAI STORE reserves the right to suspend or terminate access if misuse is detected.</p>
              </section>

              <section className="terms-section">
                <h3>9. Limitation of Liability</h3>
                <p>THE SILAI STORE shall not be liable for:</p>
                <ul>
                  <li>Minor colour, fabric, or fit variations</li>
                  <li>Personal taste or subjective dissatisfaction</li>
                  <li>Any indirect, incidental, or consequential damages</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>10. Privacy Policy</h3>
                <p>All personal information shared with THE SILAI STORE is handled in accordance with our Privacy Policy. By using our services, you consent to such data collection and use.</p>
              </section>

              <section className="terms-section">
                <h3>11. Governing Law & Jurisdiction</h3>
                <p>These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of Indian courts.</p>
              </section>

              <section className="terms-section">
                <h3>12. Changes to Terms</h3>
                <p>THE SILAI STORE reserves the right to update or modify these Terms & Conditions at any time. Continued use of the website implies acceptance of the revised terms.</p>
              </section>

              <section className="terms-section">
                <h3>13. Contact Information</h3>
                <p>For any questions regarding these Terms & Conditions, please contact THE SILAI STORE using the details provided on the website.</p>
              </section>
            </div>

            <div className="terms-modal-footer">
              <button className="terms-accept-btn" onClick={() => setShowTerms(false)}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;