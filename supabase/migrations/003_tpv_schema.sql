-- ============================================
-- 003: TPV/POS System — Sessions, Orders, Table Status
-- ============================================

-- Table status enum
CREATE TYPE table_status AS ENUM ('free', 'occupied', 'en_route', 'reserved', 'inactive');

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'served', 'paid', 'cancelled');

-- Migrate tables: replace is_active with status + add qr_code
ALTER TABLE tables
  ADD COLUMN status table_status NOT NULL DEFAULT 'free',
  ADD COLUMN qr_code TEXT UNIQUE;

-- Migrate existing data: is_active true → free, false → inactive
UPDATE tables SET status = CASE WHEN is_active THEN 'free' ELSE 'inactive' END;

-- Generate QR codes for existing tables
UPDATE tables SET qr_code = 'df-' || restaurant_id || '-' || id WHERE qr_code IS NULL;

-- Drop old column
ALTER TABLE tables DROP COLUMN is_active;

-- ─── Table Sessions ──────────────────────────────────────────────────────────

CREATE TABLE table_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id    UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at   TIMESTAMPTZ,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_table ON table_sessions(table_id) WHERE closed_at IS NULL;
CREATE INDEX idx_sessions_restaurant ON table_sessions(restaurant_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  table_id      UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status        order_status NOT NULL DEFAULT 'pending',
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);

-- ─── Order Items ─────────────────────────────────────────────────────────────

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL,
  quantity     INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes        TEXT DEFAULT ''
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Sessions: restaurant owner can CRUD, anyone can read (for QR ordering)
CREATE POLICY "Sessions: public read"
  ON table_sessions FOR SELECT USING (true);

CREATE POLICY "Sessions: owner insert"
  ON table_sessions FOR INSERT
  WITH CHECK (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

CREATE POLICY "Sessions: owner update"
  ON table_sessions FOR UPDATE
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- Orders: anyone can insert (QR ordering without auth), restaurant owner can manage
CREATE POLICY "Orders: public read"
  ON orders FOR SELECT USING (true);

CREATE POLICY "Orders: anyone can insert"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders: owner update"
  ON orders FOR UPDATE
  USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- Order items: follow order policies
CREATE POLICY "Order items: public read"
  ON order_items FOR SELECT USING (true);

CREATE POLICY "Order items: anyone can insert"
  ON order_items FOR INSERT WITH CHECK (true);

-- ─── Trigger: auto-calculate session total on order status change ────────────

CREATE OR REPLACE FUNCTION update_session_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE table_sessions
  SET total_amount = (
    SELECT COALESCE(SUM(oi.price * oi.quantity), 0)
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.session_id = NEW.session_id
      AND o.status != 'cancelled'
  )
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_session_total
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_session_total();
