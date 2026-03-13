-- ============================================
-- DineFirst — Schema Inicial PostgreSQL
-- ============================================
-- Ejecutar en Supabase SQL Editor o via supabase db push

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles (extiende auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'comensal' CHECK (role IN ('comensal', 'restaurante', 'admin')),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil público de cada usuario, vinculado a auth.users';

-- Trigger: crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'comensal'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
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

COMMENT ON TABLE public.restaurants IS 'Restaurantes registrados en la plataforma';

-- ============================================
-- TABLA: tables (mesas)
-- ============================================
CREATE TABLE public.tables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location TEXT DEFAULT ''
);

CREATE INDEX idx_tables_restaurant ON public.tables(restaurant_id);

COMMENT ON TABLE public.tables IS 'Mesas de cada restaurante';

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

COMMENT ON TABLE public.menu_items IS 'Ítems del menú de cada restaurante';

-- ============================================
-- TABLA: reservations
-- ============================================
CREATE TABLE public.reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  -- Datos denormalizados para consultas rápidas
  user_name TEXT NOT NULL DEFAULT '',
  user_email TEXT NOT NULL DEFAULT '',
  user_phone TEXT DEFAULT '',
  restaurant_name TEXT NOT NULL DEFAULT '',
  restaurant_city TEXT DEFAULT '',
  table_name TEXT DEFAULT '',
  -- Datos de la reserva
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

COMMENT ON TABLE public.reservations IS 'Reservas de comensales en restaurantes';

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
  -- Un usuario solo puede dejar una reseña por restaurante
  UNIQUE(restaurant_id, user_id)
);

CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);

COMMENT ON TABLE public.reviews IS 'Reseñas de comensales sobre restaurantes';

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
-- STORAGE BUCKETS
-- ============================================
-- Ejecutar en SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Políticas de storage
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
