-- ============================================
-- Migration 001: Waiter table assignments + rotation
-- ============================================

-- 1. Add assigned_waiter_id to tables
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tables_assigned_waiter ON public.tables(assigned_waiter_id);

-- 2. Add waiter_id to table_sessions
ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Add waiter_id to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Also ensure bill_requested columns exist (from previous feature)
ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS bill_requested BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS bill_requested_at TIMESTAMPTZ;

-- 5. Rotation state per restaurant
CREATE TABLE IF NOT EXISTS public.waiter_rotation_state (
  restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  last_rotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_extra_waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waiter_rotation_state ENABLE ROW LEVEL SECURITY;

-- Owner and camareros of the restaurant can read rotation state
CREATE POLICY "rotation_select" ON public.waiter_rotation_state
  FOR SELECT TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'camarero' AND restaurant_id = waiter_rotation_state.restaurant_id
    )
  );

-- Only owner can modify rotation state
CREATE POLICY "rotation_all_owner" ON public.waiter_rotation_state
  FOR ALL TO authenticated USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );
