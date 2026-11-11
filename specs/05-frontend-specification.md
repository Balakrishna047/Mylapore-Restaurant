# Frontend Specification: Mylapore Express

- **Document ID**: FSD-ME-05
- **Version**: 2.0

---

## 1. Visual Design Language & Branding
The frontend strictly reproduces the aesthetic of the authentic Mylapore heritage as captured in the brand design assets:
- **Primary Color Palette**:
  - Sand / Cream Background: `#FBF7F0` / `#FAF4E8`
  - Saffron / Mustard Ochre: `#C8851A` / `#D97706`
  - Terracotta / Coral Red (Action & Primary CTA): `#D95338` / `#C84B31`
  - Cardamom Deep Forest Green (Vegetarian & Fresh badges): `#15803D`
  - Deep Charcoal Gray (Typography): `#1C1917` / `#292524`
  - Light Sand Card Borders: `#E7DFD5` / `#F0ECE1`
- **Typography**: Clean serif headings for traditional South Indian culinary prestige combined with legible geometric sans-serif for prices, ingredient labels, and UI controls.
- **Imagery**: Authentic, mouth-watering photographs of freshly cooked, blast-chilled South Indian dishes, served with traditional banana leaf and brassware nuances.

---

## 2. Customer Pages & Navigation Map

1. **Header & Global Navigation**:
   - Mylapore Express Temple Gopuram Crest logo.
   - "Deliver to: Set Location" modal selector.
   - Search bar with live type-ahead query.
   - Category Bar pills (All Products, Curries, Rice, Sambar, Rasam, Chutneys, Desserts, Beverages, Batters, Specials, Pickles).
   - Theme toggle, Language selector, Cart badge with real-time item counter, "My Orders", "Sign In", and prominent terracotta "Create Account" button.
2. **Home Page (`/`)**:
   - Hero 3-card banner (Delivery selector, Authentic Blast Chilled badge, Choose & Order).
   - "Customer favorites" carousel / grid with order counts (e.g. `1,000+ ordered`).
   - "Kootu & Poriyal" showcase with "View all ->".
   - "North Indian Favourites" with "View all ->".
   - "Breakfast & Tiffin" showcase with "View all ->".
   - "Our Collections - Chosen by our kitchen" (Best Sellers, Paneer Favourites, Rice Bowls, Tea-time Snacks).
   - "Hungry? Your next meal is a tap away" call to action banner.
   - Rich 4-column footer with live contact info (`(925) 238-3736`, `support@mylaporeexpress.com`).
3. **Menu & Product Details (`/menu`, `/products/:id`)**:
   - Product details page featuring image gallery, quotes ("Authentic South Indian flavors, made the way our grandmothers did."), price, blast-chilled temperature advice, dietary tags (Vegetarian, Vegan, Jain, Heat Level meters 🌶️🌶️🌶️), Allergen warnings, collapsible Ingredients & Nutrition tables, customer reviews, and sticky Add-to-Cart.
4. **Cart Drawer & Checkout (`/cart`, `/checkout`)**:
   - Item quantity controls, special instructions, order type toggle (Delivery / Pickup), scheduled delivery date/time slot picker, promo coupon input, real-time breakdown (subtotal, tax 8.25%, delivery fee, tip), Stripe card payment element.
5. **Order Tracking & Management (`/orders/:id`, `/orders/:id/track`)**:
   - Live visual step-indicator with state animation, estimated delivery countdown, kitchen status notes, cancellation button (with refund breakdown), and rescheduling modal.
6. **Customer Account & Support (`/profile`, `/orders`, `/support`)**:
   - Address book management, order history with one-click re-order, and interactive AI Support Chatbot widget dockable on any screen.
7. **Administration Portal (`/admin`)**:
   - Metrics overview (Daily GMV, Active orders, Kitchen load).
   - Live Kitchen Display System (KDS) with one-click status transitions.
   - Menu & Inventory stock toggle (86 item).
   - Support Case ticket review and Salesforce sync status.
