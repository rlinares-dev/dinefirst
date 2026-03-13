-- ============================================
-- DineFirst — Seed Data
-- ============================================
-- NOTA: Los usuarios demo se crean via Supabase Dashboard o API
-- porque auth.users requiere password hash especial.
--
-- Pasos para seedear usuarios:
-- 1. En Supabase Dashboard → Authentication → Users → Create User
--    - admin@dinefirst.com / password123 (luego UPDATE profiles SET role='admin')
--    - restaurante@demo.com / password123 (luego UPDATE profiles SET role='restaurante')
--    - comensal@demo.com / password123 (luego UPDATE profiles SET role='comensal')
--    - javier@demo.com / password123 (luego UPDATE profiles SET role='comensal')
--
-- 2. Tras crear los usuarios, obtener sus UUIDs y reemplazar abajo.
--    O usar este script tras crear los usuarios manualmente.
--
-- ALTERNATIVA: usar supabase.auth.admin.createUser() desde un script Node.js

-- ============================================
-- Variables: reemplazar con UUIDs reales tras crear usuarios
-- ============================================
-- Para desarrollo, usamos UUIDs fijos que se reemplazarán

DO $$
DECLARE
  v_admin_id UUID;
  v_rest_owner_id UUID;
  v_comensal1_id UUID;
  v_comensal2_id UUID;
  v_rest1_id UUID;
  v_rest2_id UUID;
  v_rest3_id UUID;
BEGIN
  -- Obtener IDs de usuarios ya creados via Auth
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@dinefirst.com' LIMIT 1;
  SELECT id INTO v_rest_owner_id FROM public.profiles WHERE email = 'restaurante@demo.com' LIMIT 1;
  SELECT id INTO v_comensal1_id FROM public.profiles WHERE email = 'comensal@demo.com' LIMIT 1;
  SELECT id INTO v_comensal2_id FROM public.profiles WHERE email = 'javier@demo.com' LIMIT 1;

  -- Si no existen los usuarios, salir (primero hay que crearlos via Auth)
  IF v_rest_owner_id IS NULL THEN
    RAISE NOTICE 'Usuarios no encontrados. Créalos primero via Authentication → Users.';
    RETURN;
  END IF;

  -- ============================================
  -- RESTAURANTES
  -- ============================================
  INSERT INTO public.restaurants (id, owner_id, name, slug, city, address, cuisine_type, capacity, description, phone, opening_hours, plan, is_active, rating, review_count)
  VALUES
    (uuid_generate_v4(), v_rest_owner_id, 'La Taberna del Chef', 'la-taberna-del-chef', 'madrid', 'Calle Serrano 45, Madrid', 'Española Contemporánea', 60,
     'Un oasis gastronómico en el corazón de Madrid. Cocina española de autor con productos de temporada.',
     '+34 91 555 12 34', 'Mar–Dom 13:00–16:00, 20:00–24:00', 'pro', true, 4.50, 4)
  RETURNING id INTO v_rest1_id;

  INSERT INTO public.restaurants (id, owner_id, name, slug, city, address, cuisine_type, capacity, description, phone, opening_hours, plan, is_active, rating, review_count)
  VALUES
    (uuid_generate_v4(), v_rest_owner_id, 'El Rincón de la Abuela', 'el-rincon-de-la-abuela', 'barcelona', 'Carrer de Provença 82, Barcelona', 'Catalana Tradicional', 45,
     'Cuatro generaciones de cocina catalana auténtica. Los ingredientes llegan cada mañana del mercado.',
     '+34 93 444 56 78', 'Lun–Dom 12:00–16:00, 19:30–23:30', 'basic', true, 5.00, 3)
  RETURNING id INTO v_rest2_id;

  INSERT INTO public.restaurants (id, owner_id, name, slug, city, address, cuisine_type, capacity, description, phone, opening_hours, plan, is_active, rating, review_count)
  VALUES
    (uuid_generate_v4(), v_rest_owner_id, 'Sake & Fusion', 'sake-and-fusion', 'madrid', 'Calle Fuencarral 120, Madrid', 'Japonesa Fusión', 35,
     'Donde el umami japonés se encuentra con la despensa mediterránea. Omakase dinámico.',
     '+34 91 777 89 01', 'Mié–Dom 13:30–15:30, 20:30–23:00', 'premium', true, 4.33, 3)
  RETURNING id INTO v_rest3_id;

  -- ============================================
  -- MESAS
  -- ============================================
  -- La Taberna del Chef
  INSERT INTO public.tables (restaurant_id, name, capacity, is_active, location) VALUES
    (v_rest1_id, 'Mesa 1', 2, true, 'Terraza'),
    (v_rest1_id, 'Mesa 2', 4, true, 'Interior'),
    (v_rest1_id, 'Mesa 3', 4, true, 'Interior'),
    (v_rest1_id, 'Mesa 4', 6, true, 'Privado'),
    (v_rest1_id, 'Mesa 5', 2, false, 'Barra'),
    (v_rest1_id, 'Mesa 6', 8, true, 'Privado');

  -- El Rincón de la Abuela
  INSERT INTO public.tables (restaurant_id, name, capacity, is_active, location) VALUES
    (v_rest2_id, 'Mesa A', 2, true, 'Patio'),
    (v_rest2_id, 'Mesa B', 4, true, 'Sala principal'),
    (v_rest2_id, 'Mesa C', 4, true, 'Sala principal'),
    (v_rest2_id, 'Mesa D', 6, true, 'Sala principal');

  -- Sake & Fusion
  INSERT INTO public.tables (restaurant_id, name, capacity, is_active, location) VALUES
    (v_rest3_id, 'Barra 1', 2, true, 'Barra omakase'),
    (v_rest3_id, 'Barra 2', 2, true, 'Barra omakase'),
    (v_rest3_id, 'Mesa 1', 4, true, 'Sala'),
    (v_rest3_id, 'Mesa 2', 4, true, 'Sala');

  -- ============================================
  -- MENU ITEMS
  -- ============================================
  -- La Taberna del Chef
  INSERT INTO public.menu_items (restaurant_id, name, description, price, category, is_available) VALUES
    (v_rest1_id, 'Croquetas de jamón ibérico', 'Bechamel cremosa, jamón ibérico DO, panko dorado', 12, 'entrantes', true),
    (v_rest1_id, 'Gazpacho de temporada', 'Tomates de huerta, pepino, pimiento y aceite virgen extra', 9, 'entrantes', true),
    (v_rest1_id, 'Steak tartar', 'Solomillo picado a cuchillo, alcaparras, mostaza Dijon, yema curada', 18, 'entrantes', true),
    (v_rest1_id, 'Cocido madrileño', 'Receta tradicional de tres vuelcos, garbanzos de Fuentesaúco', 24, 'principales', true),
    (v_rest1_id, 'Lubina a la sal', 'Lubina salvaje, sal marina, aceite de oliva arbequina, limón', 28, 'principales', true),
    (v_rest1_id, 'Entrecot de vaca madurada', '400g, maduración 45 días, chimichurri casero, patatas paja', 34, 'principales', false),
    (v_rest1_id, 'Torrija caramelizada', 'Pan brioche, crema de vainilla, helado de azafrán', 8, 'postres', true),
    (v_rest1_id, 'Vino de la casa (copa)', 'Selección del sumiller, rota cada semana', 6, 'bebidas', true),
    (v_rest1_id, 'Agua mineral', 'Botella 1L con o sin gas', 3, 'bebidas', true);

  -- El Rincón de la Abuela
  INSERT INTO public.menu_items (restaurant_id, name, description, price, category, is_available) VALUES
    (v_rest2_id, 'Pa amb tomàquet', 'Pan artesano, tomate restregado, aceite virgen extra, sal gruesa', 4, 'entrantes', true),
    (v_rest2_id, 'Esqueixada de bacallà', 'Bacalao desalado, tomate, aceitunas negras, cebolla tierna', 14, 'entrantes', true),
    (v_rest2_id, 'Fideuà de gambas y sepia', 'Fideos rossejats, gambas rojas, sepia, all i oli casero', 22, 'principales', true),
    (v_rest2_id, 'Escudella i carn d''olla', 'Cocido catalán tradicional, pilota, butifarras, verduras', 20, 'principales', true),
    (v_rest2_id, 'Crema catalana', 'Receta de la abuela, azúcar caramelizado al momento', 7, 'postres', true),
    (v_rest2_id, 'Mel i mató', 'Queso fresco artesano, miel de romero, nueces', 6, 'postres', true),
    (v_rest2_id, 'Cava (botella)', 'Cava brut nature DO Penedès, botella 75cl', 22, 'bebidas', true);

  -- Sake & Fusion
  INSERT INTO public.menu_items (restaurant_id, name, description, price, category, is_available) VALUES
    (v_rest3_id, 'Edamame con flor de sal', 'Edamame al vapor, flor de sal de Ibiza', 6, 'entrantes', true),
    (v_rest3_id, 'Gyoza de cerdo ibérico', '6 piezas, cerdo ibérico, cebollino, soja ponzu', 12, 'entrantes', true),
    (v_rest3_id, 'Tartar de atún rojo', 'Atún rojo del Mediterráneo, aguacate, tobiko, trufa', 22, 'entrantes', true),
    (v_rest3_id, 'Omakase del chef (8 piezas)', 'Selección del chef según mercado: 4 nigiri + 2 sashimi + 2 rolls', 45, 'principales', true),
    (v_rest3_id, 'Ramen tonkotsu ibérico', 'Caldo 18h, cerdo ibérico, huevo ajitsuke, alga nori, bambú', 18, 'principales', true),
    (v_rest3_id, 'Mochi de té matcha', 'Mochi casero, helado de matcha premium, salsa de sésamo', 8, 'postres', true),
    (v_rest3_id, 'Sake Junmai Daiginjo (copa)', 'Selección premium, copa 90ml, servido frío', 12, 'bebidas', true);

  -- ============================================
  -- REVIEWS (el trigger recalculará el rating automáticamente)
  -- ============================================
  IF v_comensal1_id IS NOT NULL THEN
    INSERT INTO public.reviews (restaurant_id, user_id, user_name, rating, comment) VALUES
      (v_rest1_id, v_comensal1_id, 'María García', 5, 'Las croquetas de jamón ibérico son las mejores que he probado en Madrid. Ambiente íntimo y servicio impecable.'),
      (v_rest2_id, v_comensal1_id, 'María García', 5, 'La crema catalana de la abuela es legendaria. Cuatro generaciones de saber hacer se notan en cada plato.'),
      (v_rest3_id, v_comensal1_id, 'María García', 5, 'El omakase del chef es una experiencia única. Fusión japonesa-mediterránea muy bien ejecutada.');
  END IF;

  IF v_comensal2_id IS NOT NULL THEN
    INSERT INTO public.reviews (restaurant_id, user_id, user_name, rating, comment) VALUES
      (v_rest1_id, v_comensal2_id, 'Javier López', 5, 'El cocido madrileño de tres vuelcos es espectacular. Productos de primera calidad.'),
      (v_rest2_id, v_comensal2_id, 'Javier López', 5, 'Fideuà de gambas increíble. El patio interior es un oasis en Barcelona.'),
      (v_rest3_id, v_comensal2_id, 'Javier López', 4, 'Ramen tonkotsu con cerdo ibérico: una locura. El sake Junmai Daiginjo marida genial.');
  END IF;

  RAISE NOTICE 'Seed completado: 3 restaurantes, 14 mesas, 23 items menú, 6 reseñas';
END $$;
