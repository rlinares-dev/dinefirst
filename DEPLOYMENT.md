# DineFirst — Reglas de Despliegue

## Flujo de ramas

```
develop → preproduccion → produccion → main
```

- **develop**: desarrollo activo, features en progreso
- **preproduccion**: staging, aquí se valida antes de producción
- **produccion**: release candidate, última validación
- **main**: producción final, solo merges desde produccion

## Checklist pre-despliegue (OBLIGATORIO)

Antes de hacer merge a la siguiente rama, **todos** estos pasos deben pasar:

### 1. TypeScript — Zero errores
```bash
npx tsc --noEmit
```
- No se permite `any` explícito
- No se permiten errores de tipos suprimidos con `@ts-ignore`

### 2. Lint
```bash
npm run lint
```
- Cero warnings y cero errores

### 3. Tests unitarios
```bash
npm test
```
- Todos los tests deben pasar (exit code 0)
- Cobertura mínima recomendada: 70% en archivos modificados
- Tests críticos: data layer (`lib/data.ts`), hooks, componentes TPV

### 4. Build de producción
```bash
npm run build
```
- Build debe completar sin errores
- Verificar que no hay warnings de tamaño de bundle excesivo

### 5. Migraciones SQL
- Verificar que todas las migraciones en `supabase/migrations/` están aplicadas en la BD destino
- Las migraciones se ejecutan en orden numérico (000, 001, 002...)
- **Nunca** modificar una migración ya aplicada — crear una nueva

### 6. Variables de entorno
Verificar que el entorno destino tiene configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `OPENROUTER_API_KEY` (requerido para Chat AI)
- `NEXT_PUBLIC_APP_URL` (URL del entorno)

### 7. Verificación funcional manual
Antes de merge a **produccion** o **main**, verificar manualmente:
- [ ] Login como restaurante → ve dashboard con mesas
- [ ] Login como camarero → solo ve sus mesas asignadas
- [ ] TPV: ocupar mesa, ver sesión, liberar mesa
- [ ] QR cliente: ver carta, hacer pedido, pedir cuenta
- [ ] Comandas: pedidos aparecen, cambio de estado funciona
- [ ] Push notifications: banner aparece, suscripción funciona
- [ ] Chat AI: widget visible, responde preguntas (requiere OPENROUTER_API_KEY)
- [ ] Equipo: CRUD camareros, rotación de mesas

## Proceso de merge

### develop → preproduccion
1. Ejecutar checklist pasos 1-4
2. `git checkout preproduccion && git merge develop`
3. Resolver conflictos si los hay
4. Push y verificar deploy de staging

### preproduccion → produccion
1. Ejecutar checklist pasos 1-6
2. Verificación funcional (paso 7) en entorno staging
3. `git checkout produccion && git merge preproduccion`
4. Push y verificar deploy

### produccion → main
1. Verificación funcional en entorno de producción
2. `git checkout main && git merge produccion`
3. Tag de versión: `git tag -a vX.Y.Z -m "Release X.Y.Z"`
4. Push con tags: `git push origin main --tags`

## Rollback
- Si algo falla en producción: `git revert` del merge commit
- **Nunca** hacer `git reset --hard` ni `git push --force` en main/produccion
- Las migraciones SQL no tienen rollback automático — crear migración inversa si es necesario

## Convenciones de commit
```
feat: descripción corta     — nueva funcionalidad
fix: descripción corta      — corrección de bug
refactor: descripción corta — reestructuración sin cambio funcional
test: descripción corta     — tests nuevos o modificados
docs: descripción corta     — documentación
chore: descripción corta    — mantenimiento, deps, config
```
