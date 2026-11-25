/**
 * Domain & database types for AgungDurian V2.
 * Mirrors `supabase/schema.sql` + `supabase/migration_v2.sql`.
 */

export type HarvestStatus = "panen_raya" | "stok_terbatas" | "pre_order";
export type OrderStatus =
  | "pending_approval"
  | "approved"
  | "preparing"
  | "ready_or_shipping"
  | "completed"
  | "rejected"
  | "cancelled";
export type ApprovalStatus = "pending_approval" | "approved" | "rejected";
export type PaymentMethod = "dana" | "cod" | "ambil_di_tempat";
export type PaymentStatus = "unpaid" | "waiting_verification" | "paid" | "rejected";
export type VarietyCategory = "lokal" | "premium" | "kupas";
export type DeliveryMethod = "pickup" | "local_delivery" | "shipping_vacuum";

export type SellMode = "butir" | "gram";
export type ButirSize = "sedang" | "besar" | "jumbo";
export type ButirPreparation = "utuh" | "kupas";
export type GramPackaging = "thinwall" | "vacuum";

export type WhyIconName = "shield" | "sprout" | "scale" | "truck";

export type WhyItem = {
  title: string;
  description: string;
  badge: string;
  icon: WhyIconName;
};

export type StatusHistoryEntry = {
  status: OrderStatus;
  note: string;
  timestamp: string;
  actor: string;
};

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
  hero_image_url: string;
  logo_image_url: string | null;
  og_image_url: string;
  story_image_url: string | null;
  location_image_url: string | null;
  dana_qr_image_url: string | null;
  hero_badge_text: string;
  cta_primary_text: string;
  footer_description: string;
  why_items_json: WhyItem[];
  payment_dana_enabled: boolean;
  payment_dana_number: string;
  payment_dana_holder: string;
  payment_dana_instructions: string;
  payment_cod_enabled: boolean;
  payment_cod_notes: string;
  payment_pickup_enabled: boolean;
  payment_pickup_notes: string;
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
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  approval_status: ApprovalStatus;
  status: OrderStatus;
  admin_note: string | null;
  approved_at: string | null;
  approved_by: string | null;
  status_history_json: StatusHistoryEntry[];
  stock_deducted: boolean;
  created_at: string;
};

/** Non-sensitive customer-facing order view returned by public invoice/tracking RPCs. */
export type PublicOrder = {
  order_code: string;
  customer_name: string;
  masked_phone: string;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  approval_status: ApprovalStatus;
  status: OrderStatus;
  admin_note: string | null;
  items_json: OrderItem[];
  total_amount: number;
  status_history_json: StatusHistoryEntry[];
  approved_at: string | null;
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

type OrderInsert = Optional<
  Order,
  | "id"
  | "created_at"
  | "status"
  | "approval_status"
  | "payment_status"
  | "payment_proof_url"
  | "admin_note"
  | "approved_at"
  | "approved_by"
  | "status_history_json"
  | "stock_deducted"
  | "delivery_address"
  | "notes"
>;

type TestimonialInsert = Optional<Testimonial, "id" | "created_at" | "is_visible" | "purchased_variant">;

export type OrderAdminAction =
  | "approve"
  | "reject"
  | "preparing"
  | "ready_or_shipping"
  | "completed"
  | "cancelled";

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
      adjust_product_stock: {
        Args: { p_product_id: string; p_field: "stock_butir" | "stock_gram"; p_delta: number };
        Returns: Product;
      };
      get_public_order: {
        Args: { p_order_code: string };
        Returns: PublicOrder | null;
      };
      track_orders_by_query: {
        Args: { p_query: string };
        Returns: PublicOrder[];
      };
      attach_order_payment_proof: {
        Args: { p_order_code: string; p_proof_url: string };
        Returns: PublicOrder;
      };
      process_order_action: {
        Args: {
          p_order_id: string;
          p_action: OrderAdminAction;
          p_admin_note?: string | null;
          p_actor?: string;
          p_verify_payment?: boolean;
        };
        Returns: Order;
      };
    };
    Enums: {
      harvest_status: HarvestStatus;
      variety_category: VarietyCategory;
      delivery_method: DeliveryMethod;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
