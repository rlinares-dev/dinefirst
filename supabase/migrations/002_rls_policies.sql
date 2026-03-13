-- ============================================
-- DineFirst — Row Level Security Policies
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================

-- Cualquier usuario autenticado puede ver perfiles (necesario para mostrar nombres)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuarios anónimos pueden ver perfiles públicos (para páginas de restaurante)
CREATE POLICY "profiles_select_anon"
  ON public.profiles FOR SELECT
  TO anon
  USING (role = 'restaurante');

-- Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No permitir INSERT manual (el trigger lo maneja)
-- No permitir DELETE directo (se hace via auth.users CASCADE)

-- ============================================
-- RESTAURANTS
-- ============================================

-- Cualquiera puede ver restaurantes activos (páginas públicas)
CREATE POLICY "restaurants_select_public"
  ON public.restaurants FOR SELECT
  USING (is_active = true);

-- Owners pueden ver sus propios restaurantes (incluso inactivos)
CREATE POLICY "restaurants_select_owner"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Admins pueden ver todos
CREATE POLICY "restaurants_select_admin"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Solo restaurantes pueden crear (uno por owner)
CREATE POLICY "restaurants_insert_owner"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'restaurante')
  );

-- Solo el owner puede actualizar
CREATE POLICY "restaurants_update_owner"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Solo el owner puede eliminar
CREATE POLICY "restaurants_delete_owner"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================
-- TABLES (mesas)
-- ============================================

-- Cualquiera puede ver mesas (necesario para formulario de reserva)
CREATE POLICY "tables_select_public"
  ON public.tables FOR SELECT
  USING (true);

-- Solo el owner del restaurante puede gestionar mesas
CREATE POLICY "tables_insert_owner"
  ON public.tables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "tables_update_owner"
  ON public.tables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "tables_delete_owner"
  ON public.tables FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

-- ============================================
-- MENU_ITEMS
-- ============================================

-- Cualquiera puede ver el menú
CREATE POLICY "menu_select_public"
  ON public.menu_items FOR SELECT
  USING (true);

-- Solo el owner del restaurante puede gestionar menú
CREATE POLICY "menu_insert_owner"
  ON public.menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "menu_update_owner"
  ON public.menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "menu_delete_owner"
  ON public.menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

-- ============================================
-- RESERVATIONS
-- ============================================

-- Comensales ven sus propias reservas
CREATE POLICY "reservations_select_user"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Owners ven reservas de su restaurante
CREATE POLICY "reservations_select_owner"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

-- Admins ven todas las reservas
CREATE POLICY "reservations_select_admin"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Comensales autenticados crean reservas (user_id debe ser el propio)
CREATE POLICY "reservations_insert_user"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner puede cambiar status; usuario puede cancelar la suya
CREATE POLICY "reservations_update_owner"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
  );

CREATE POLICY "reservations_update_user_cancel"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status != 'cancelled')
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled');

-- Admin puede actualizar cualquier reserva
CREATE POLICY "reservations_update_admin"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- REVIEWS
-- ============================================

-- Cualquiera puede ver reseñas
CREATE POLICY "reviews_select_public"
  ON public.reviews FOR SELECT
  USING (true);

-- Comensales autenticados pueden crear reseñas
CREATE POLICY "reviews_insert_user"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden eliminar sus propias reseñas
CREATE POLICY "reviews_delete_own"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins pueden eliminar cualquier reseña
CREATE POLICY "reviews_delete_admin"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
