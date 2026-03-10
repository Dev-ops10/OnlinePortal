export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  customer_group: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Product {
  id: string;
  item_name: string;
  sku: string;
  category: string;
  price: number;
  image_url: string | null;
  description: string | null;
  customer_groups: string[];
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  company: string;
  customer_group: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
