/**
 * Domain & database types for AgungDurian.
 * Mirrors `supabase/schema.sql`. Kept hand-written (instead of generated) so the
 * project compiles without the Supabase CLI, while still giving a fully typed client.
 */

export type HarvestStatus = "panen_raya" | "stok_terbatas" | "pre_order";
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type VarietyCategory = "lokal" | "premium" | "kupas";
export type DeliveryMethod = "pickup" | "local_delivery" | "shipping_vacuum";

export type SellMode = "butir" | "gram";
export type ButirSize = "sedang" | "besar" | "jumbo";
export type ButirPreparation = "utuh" | "kupas";
export type GramPackaging = "thinwall" | "vacuum";

export type StoreSettings = {
  id: number;
  store_name: string;
  tagline: string;
  whatsapp_number: string;
  instagram_handle: string;
  address: string;
  maps_url: string;
  opening_hours: string;
  harvest_status: HarvestStatus;
  harvest_banner_text: string;
  marquee_items: string[];
  hero_headline: string;
  hero_subheadline: string;
  google_rating: number;
  google_review_count: number;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  variety_category: VarietyCategory;
  description: string;
  origin_notes: string;
  image_url: string | null;
  allow_butir: boolean;
  price_butir: number;
  avg_weight_kg: number;
  stock_butir: number;
  allow_gram: boolean;
  price_per_100g: number;
  stock_gram: number;
  min_gram: number;
  max_gram: number;
  taste_sweet: number;
  taste_creamy: number;
  taste_bitter: number;
  taste_thickness: number;
  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** A single line item as persisted in `orders.items_json`. Prices are server-computed. */
export type OrderItem =
  | {
      mode: "butir";
      product_id: string;
      product_name: string;
      size: ButirSize;
      preparation: ButirPreparation;
      quantity: number;
      unit_price: number;
      line_total: number;
    }
  | {
      mode: "gram";
      product_id: string;
      product_name: string;
      grams: number;
      packaging: GramPackaging;
      quantity: number;
      unit_price: number;
      line_total: number;
    };

export type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  delivery_method: DeliveryMethod;
  delivery_address: string | null;
  notes: string | null;
  items_json: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  stock_deducted: boolean;
  created_at: string;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  origin_city: string;
  rating: number;
  comment: string;
  purchased_variant: string | null;
  is_visible: boolean;
  created_at: string;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type ProductInsert = Optional<
  Product,
  | "id"
  | "created_at"
  | "updated_at"
  | "description"
  | "origin_notes"
  | "image_url"
  | "badge"
  | "sort_order"
  | "is_featured"
  | "is_active"
>;

type OrderInsert = Optional<Order, "id" | "created_at" | "status" | "stock_deducted" | "delivery_address" | "notes">;
type TestimonialInsert = Optional<Testimonial, "id" | "created_at" | "is_visible" | "purchased_variant">;

export type Database = {
  public: {
    Tables: {
      store_settings: {
        Row: StoreSettings;
        Insert: Partial<StoreSettings>;
        Update: Partial<StoreSettings>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: Partial<Product>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: Partial<Order>;
        Relationships: [];
      };
      testimonials: {
        Row: Testimonial;
        Insert: TestimonialInsert;
        Update: Partial<Testimonial>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      apply_order_stock: {
        Args: { p_order_id: string; p_direction?: "deduct" | "restore" };
        Returns: undefined;
      };
      transition_order_status: {
        Args: { p_order_id: string; p_status: OrderStatus; p_deduct?: boolean };
        Returns: Order;
      };
      adjust_product_stock: {
        Args: { p_product_id: string; p_field: "stock_butir" | "stock_gram"; p_delta: number };
        Returns: Product;
      };
    };
    Enums: {
      harvest_status: HarvestStatus;
      order_status: OrderStatus;
      variety_category: VarietyCategory;
      delivery_method: DeliveryMethod;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
