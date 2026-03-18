-- ============================================
-- DineFirst — Migración completa
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles (extiende auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'comensal' CHECK (role IN ('comensal', 'restaurante', 'admin', 'camarero')),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  username TEXT,
  restaurant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil público de cada usuario, vinculado a auth.users';

-- Trigger: crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, username, restaurant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'comensal'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'restaurant_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABLA: restaurants
-- ============================================
CREATE TABLE public.restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  cuisine_type TEXT NOT NULL DEFAULT '',
  capacity INT NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  opening_hours TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'premium')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_active ON public.restaurants(is_active) WHERE is_active = true;

-- FK de profiles.restaurant_id a restaurants (se crea después porque restaurants depende de profiles)
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_restaurant
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE SET NULL;

-- Unique constraint: username per restaurant
CREATE UNIQUE INDEX idx_unique_username_per_restaurant
  ON public.profiles(username, restaurant_id)
  WHERE role = 'camarero' AND username IS NOT NULL;

-- ============================================
-- TABLA: tables (mesas)
-- ============================================
CREATE TABLE public.tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  location TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'en_route', 'reserved', 'inactive')),
  qr_code TEXT UNIQUE
);

CREATE INDEX idx_tables_restaurant ON public.tables(restaurant_id);

-- ============================================
-- TABLA: menu_items
-- ============================================
CREATE TABLE public.menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(8,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'principales' CHECK (category IN ('entrantes', 'principales', 'postres', 'bebidas')),
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT
);

CREATE INDEX idx_menu_restaurant ON public.menu_items(restaurant_id);

-- ============================================
-- TABLA: reservations
-- ============================================
CREATE TABLE public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_email TEXT NOT NULL DEFAULT '',
  user_phone TEXT DEFAULT '',
  restaurant_name TEXT NOT NULL DEFAULT '',
  restaurant_city TEXT DEFAULT '',
  table_name TEXT DEFAULT '',
  date DATE NOT NULL,
  time TEXT NOT NULL,
  party_size INT NOT NULL DEFAULT 2 CHECK (party_size >= 1 AND party_size <= 20),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show')),
  special_requests TEXT DEFAULT '',
  confirmation_code TEXT NOT NULL UNIQUE,
  whatsapp_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_restaurant ON public.reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON public.reservations(date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_code ON public.reservations(confirmation_code);

-- ============================================
-- TABLA: reviews
-- ============================================
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

-- ============================================
-- FUNCIÓN: recalcular rating del restaurante
-- ============================================
CREATE OR REPLACE FUNCTION public.recalculate_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.restaurants
  SET
    rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id)), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE restaurant_id = COALESCE(NEW.restaurant_id, OLD.restaurant_id))
  WHERE id = COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_restaurant_rating();

-- ============================================
-- TPV: table_sessions
-- ============================================
CREATE TABLE public.table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  bill_requested BOOLEAN NOT NULL DEFAULT false,
  bill_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_table ON public.table_sessions(table_id) WHERE closed_at IS NULL;
CREATE INDEX idx_sessions_restaurant ON public.table_sessions(restaurant_id);

-- ============================================
-- TPV: orders
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.table_sessions(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'served', 'paid', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_session ON public.orders(session_id);
CREATE INDEX idx_orders_restaurant_status ON public.orders(restaurant_id, status);

-- ============================================
-- TPV: order_items
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT DEFAULT ''
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================
-- Trigger: auto-calculate session total
-- ============================================
CREATE OR REPLACE FUNCTION public.update_session_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.table_sessions
  SET total_amount = (
    SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.session_id = NEW.session_id
      AND o.status != 'cancelled'
  )
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_total
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_total();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

CREATE POLICY "Imágenes restaurante públicas" ON storage.objects
  FOR SELECT USING (bucket_id IN ('restaurant-images', 'menu-images'));

CREATE POLICY "Restaurantes suben imágenes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('restaurant-images', 'menu-images')
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Restaurantes borran sus imágenes" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('restaurant-images', 'menu-images')
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_select_anon" ON public.profiles FOR SELECT TO anon USING (role = 'restaurante');
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RESTAURANTS
CREATE POLICY "restaurants_select_public" ON public.restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "restaurants_select_owner" ON public.restaurants FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "restaurants_select_admin" ON public.restaurants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "restaurants_insert_owner" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'restaurante'));
CREATE POLICY "restaurants_update_owner" ON public.restaurants FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "restaurants_delete_owner" ON public.restaurants FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- TABLES
CREATE POLICY "tables_select_public" ON public.tables FOR SELECT USING (true);
CREATE POLICY "tables_insert_owner" ON public.tables FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "tables_update_owner" ON public.tables FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "tables_delete_owner" ON public.tables FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));

-- MENU ITEMS
CREATE POLICY "menu_select_public" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu_insert_owner" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "menu_update_owner" ON public.menu_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "menu_delete_owner" ON public.menu_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));

-- RESERVATIONS
CREATE POLICY "reservations_select_user" ON public.reservations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reservations_select_owner" ON public.reservations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "reservations_select_admin" ON public.reservations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "reservations_insert_user" ON public.reservations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reservations_update_owner" ON public.reservations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid()));
CREATE POLICY "reservations_update_user_cancel" ON public.reservations FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status != 'cancelled') WITH CHECK (user_id = auth.uid() AND status = 'cancelled');
CREATE POLICY "reservations_update_admin" ON public.reservations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- REVIEWS
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_user" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reviews_delete_admin" ON public.reviews FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- TABLE SESSIONS
CREATE POLICY "sessions_select_public" ON public.table_sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert_owner" ON public.table_sessions FOR INSERT WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "sessions_update_owner" ON public.table_sessions FOR UPDATE USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- ORDERS
CREATE POLICY "orders_select_public" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_anyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_owner" ON public.orders FOR UPDATE USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- ORDER ITEMS
CREATE POLICY "order_items_select_public" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert_anyone" ON public.order_items FOR INSERT WITH CHECK (true);

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
