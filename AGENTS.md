# Tay Préstamos (App de Tay)

App Android nativa offline-first para **Tay**, prestamista personal / microcréditos:
administración de préstamos, clientes/deudores, cobranzas con notificaciones de corte,
cálculo automático de intereses y abonos a capital, y separación contable estricta entre
**Capital de trabajo (fondo que vuelve y se presta)** e **Intereses ganados (utilidad real de Tay)**.
**Cuarta app hermana** de `../natalia` (arepas), `../susana` (parqueadero) y `../kelly` (KR Nails) — mismas convenciones y stack.

> Expo SDK 57 + React Native 0.86 + React 19 + TypeScript estricto.

---

## 1. Qué pidió Tay (Audios del 2026-08-31)

1. **Porcentajes de interés variables y editables**: Cada préstamo puede pactarse al 10%, 15%, 20%, etc.
2. **Frecuencias de cobro flexibles**:
   - **Quincenal** (cada 15 días)
   - **Mensual** (cada 30 días / mes)
   - **Semanal** (cada 7 días)
   - **Personalizado / Cada N días** (ej. cada 20 días).
3. **Separación contable estricta entre Capital e Intereses**:
   - *"El capital es lo que yo vuelvo y presto, que vuelve y lo recibo. El interés sí es mío, es mi ganancia."*
4. **Ficha de clientes y tracking de deudas**:
   - Nombre, celular, alias/negocio, acuerdos, fecha de inicio del préstamo.
   - Saldo de capital restante y estado de mora.
5. **Notificaciones locales y Alertas de Cobro**:
   - *"Que cuando a la persona le toque pagar interés ese día me avise con una notificación en el celular"*.
   - Vista inicial de **"Cobros de Hoy"** y alertas de préstamos atrasados.
   - Botón directo de **WhatsApp (1-tap)** para enviar recordatorio o comprobante de recaudo.

---

## 2. Stack Tecnológico

- **Expo SDK 57** + RN 0.86 + React 19 + TypeScript estricto + React Compiler
- **expo-router** (file-based) con pestañas nativas
- **SQLite local** vía `expo-sqlite` + `drizzle-orm` (offline-first, 100% privado en el teléfono)
- **@tanstack/react-query** v5 para estado reactivo e invalidación limpia
- **expo-notifications** para alertas locales matutinas el día del corte
- **expo-sharing** y **expo-file-system** para respaldo JSON manual y auto-respaldo diario local (7 copias)
- WhatsApp vía `wa.me` con plantillas en `src/lib/whatsapp.ts`
- **lucide-react-native** iconos · Toasts propios (`src/lib/toast.tsx`) · **expo-haptics**
- Tipografía: **Quicksand** (títulos) + **Nunito** (cuerpo)

---

## 3. Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run start             # expo start --dev-client

# Generar migraciones de base de datos
npm run db:generate       # drizzle-kit generate + bundle-migrations.js

# Build nativo Android (EAS Cloud)
eas build --profile development --platform android   # Dev Client
eas build --profile production --platform android    # APK final standalone

# Actualizaciones JS sin reinstalar APK
eas update --channel production --platform android   # OTA update

# Regenerar íconos
node scripts/generate-icons.js
```

---

## 4. Modelo de Datos (`src/db/schema.ts`)

- `clients`: ficha de cliente (nombre, alias, teléfono, dirección, notas, active).
- `loans`: préstamos (cliente, `initialAmount`, `currentCapital`, `interestRate`, `paymentFrequency`, `frequencyDays`, `startDate`, `nextDueDate`, `status`).
- `payments`: recaudos registrados (`loanId`, `clientId`, `interestAmount` [ganancia], `capitalAmount` [retorno al fondo], `totalAmount`, `paymentMethod`, `receiptPhotoUri`, `date`).
- `capital_movements`: inyecciones al fondo de préstamos y retiros de capital o utilidades (`type`, `amount`, `date`, `notes`).
- `expenses`: gastos operativos del negocio (`category`, `amount`, `date`, `notes`).

---

## 5. Convenciones de Código

- **Money**: Enteros COP (INTEGER) sin centavos. Formatear con `money(pesos)` de `@/lib/format`.
- **IDs**: UUID v7 ordenables por tiempo (`newId()` de `@/lib/id`).
- **Patrón CRUD**: `db/queries/*.ts` → `features/*/hooks.ts` → Componentes UI.
- **Estado Global**: Store de módulo con `useSyncExternalStore` (`src/lib/settings.ts`).
- **Módulos nativos defensivos**: `expo-notifications`, `expo-image-picker`, `expo-updates`.
- **Respaldo JSON**: Exportable a WhatsApp/Drive; auto-respaldo diario local rotativo de 7 copias.

---

## 6. Estructura de Pantallas (Tabs)

1. **`/(tabs)/index.tsx` (Cobros Hoy)**:
   - Resumen hero de cobros del día y alertas de mora.
   - Botón directo "Cobrar" y "WhatsApp" en cada tarjeta.
2. **`/(tabs)/prestamos.tsx` (Préstamos)**:
   - Filtros: Activos, Cobrar Hoy, En Mora, Pagados.
   - Tarjetas con barra de progreso de retorno de capital.
3. **`/(tabs)/clientes.tsx` (Directorio de Clientes)**:
   - Saldo de capital adeudado por cliente, acceso rápido a llamada y WhatsApp.
   - Ficha con historial completo de préstamos y pagos.
4. **`/(tabs)/capital.tsx` (Caja & Capital)**:
   - Hero de Ganancia Neta Real de Tay (Intereses).
   - Capital en la calle vs Capital recuperado.
   - Desglose por método de pago (Nequi, Efectivo, Bancolombia, etc.).
   - Fondo de préstamos (inyecciones y retiros).
5. **`/ajustes.tsx` (Ajustes & Respaldo)**:
   - Configuración de negocio, medios de pago para WhatsApp, hora de notificación y copia de seguridad JSON.
