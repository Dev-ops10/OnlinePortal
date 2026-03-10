# B2B Ordering Portal - OrderPro

A professional B2B ordering portal for commercial equipment and smallwares, built with Next.js, Tailwind CSS, and Supabase.

## Features

- **Customer Segmentation** — Users only see products assigned to their Customer Group
- **Password Wall** — No products or pricing visible without authentication
- **Catalog View** — Searchable, filterable product grid with category navigation
- **Quick Order Form** — Table-style bulk ordering optimized for smallwares
- **Cart & Checkout** — Submit sales orders (no credit card processing)
- **Order Confirmation** — Automated email with HTML order summary via Resend
- **Order History** — View past orders with expandable line item details
- **Admin CSV Upload** — Upsert SAP B1 Item Master data by SKU
- **Mobile Responsive** — Optimized for store managers ordering on the floor

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Row Level Security)
- **Email**: Resend API
- **Icons**: Lucide React

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run `supabase/schema.sql` in the SQL Editor to create tables, RLS policies, and functions
3. Optionally run `supabase/seed.sql` to add sample products

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key
ORDER_FROM_EMAIL=orders@yourdomain.com
```

### 3. Create First Admin User

1. Create a user in Supabase Auth (Dashboard > Authentication > Users)
2. Set user metadata: `{"full_name": "Admin", "company": "Your Company", "customer_group": "Chain A", "role": "admin"}`
3. The trigger will auto-create the profile row

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Upload Products

1. Log in as admin
2. Navigate to Admin > Upload
3. Upload a CSV with columns: `ItemName,SKU,Category,Price,ImageURL,Description,CustomerGroups,UnitOfMeasure`
4. Use `|` to separate multiple customer groups (e.g., `Chain A|Independent B`)

See `sample-import.csv` for an example.

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User company and customer group assignment |
| `products` | Item master with customer group tags (array) |
| `orders` | Sales order headers with status tracking |
| `order_items` | Line items per order with SKU and quantity |

Row Level Security ensures users only see products matching their customer group and only their own orders.
