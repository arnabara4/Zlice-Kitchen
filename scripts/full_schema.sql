-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.auth_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['super_admin'::text, 'canteen'::text, 'delivery'::text, 'user'::text])),
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auth_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.canteens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  address text,
  slideshow_enabled boolean DEFAULT false,
  slideshow_interval integer DEFAULT 5000,
  slideshow_items jsonb DEFAULT '[]'::jsonb,
  orders_display_interval integer DEFAULT 10000,
  orders_display_duration integer DEFAULT 15000,
  is_online boolean NOT NULL DEFAULT false,
  category_id uuid,
  CONSTRAINT canteens_pkey PRIMARY KEY (id),
  CONSTRAINT canteens_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_man (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  vehicle_type text,
  vehicle_number text,
  id_proof_type text,
  id_proof_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_active boolean DEFAULT true,
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_hash text,
  CONSTRAINT delivery_man_pkey PRIMARY KEY (id)
);
CREATE TABLE public.delivery_man_canteens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_man_id uuid,
  canteen_id uuid,
  assigned_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_man_canteens_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_man_canteens_delivery_man_id_fkey FOREIGN KEY (delivery_man_id) REFERENCES public.delivery_man(id),
  CONSTRAINT delivery_man_canteens_canteen_id_fkey FOREIGN KEY (canteen_id) REFERENCES public.canteens(id)
);
CREATE TABLE public.item_offers (
  id integer NOT NULL DEFAULT nextval('item_offers_id_seq'::regclass),
  item_id uuid NOT NULL,
  offer_description text,
  discount_percentage numeric CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
  valid_from timestamp without time zone DEFAULT now(),
  valid_until timestamp without time zone,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT item_offers_pkey PRIMARY KEY (id),
  CONSTRAINT item_offers_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.khata_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  entry_type text NOT NULL DEFAULT 'debit'::text CHECK (entry_type = ANY (ARRAY['debit'::text, 'credit'::text])),
  note text,
  created_at timestamp with time zone DEFAULT now(),
  balance_after numeric,
  canteen_id uuid,
  CONSTRAINT khata_entries_pkey PRIMARY KEY (id),
  CONSTRAINT khata_entries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.khata_students(id),
  CONSTRAINT khata_entries_canteen_id_fkey FOREIGN KEY (canteen_id) REFERENCES public.canteens(id)
);
CREATE TABLE public.khata_students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_number text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  prepaid_balance numeric NOT NULL DEFAULT 0,
  canteen_id uuid,
  phone_number text,
  CONSTRAINT khata_students_pkey PRIMARY KEY (id),
  CONSTRAINT khata_students_canteen_id_fkey FOREIGN KEY (canteen_id) REFERENCES public.canteens(id)
);
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  canteen_id uuid,
  is_available boolean DEFAULT true,
  category text,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_canteen_id_fkey FOREIGN KEY (canteen_id) REFERENCES public.canteens(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status = ANY (ARRAY['not_started'::text, 'cooking'::text, 'ready'::text, 'completed'::text])),
  total_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order_number text NOT NULL UNIQUE,
  canteen_id uuid,
  payment_status text NOT NULL DEFAULT 'unpaid'::text CHECK (payment_status = ANY (ARRAY['paid'::text, 'unpaid'::text])),
  order_type text,
  delivery_man_id uuid,
  delivery_status text CHECK (delivery_status = ANY (ARRAY['assigned'::text, 'picked_up'::text, 'in_transit'::text, 'delivered'::text, 'cancelled'::text])),
  user_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_canteen_id_fkey FOREIGN KEY (canteen_id) REFERENCES public.canteens(id),
  CONSTRAINT orders_delivery_man_id_fkey FOREIGN KEY (delivery_man_id) REFERENCES public.delivery_man(id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.otp_codes (
  id integer NOT NULL DEFAULT nextval('otp_codes_id_seq'::regclass),
  order_id uuid NOT NULL UNIQUE,
  otp_hash text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  expires_at timestamp without time zone NOT NULL DEFAULT (now() + '1 day'::interval),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id),
  CONSTRAINT otp_codes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phone character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  roll_number character varying UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  name character varying NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);