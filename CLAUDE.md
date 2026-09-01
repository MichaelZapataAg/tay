# Tay Préstamos

App Android nativa offline-first para administración de préstamos personales, tracking de deudores, alertas de fechas de corte y separación contable de Capital vs Intereses para **Tay**. Cuarta app hermana de `../natalia`, `../susana` y `../kelly`.

## Stack
- Expo SDK 57 + React Native 0.86 + React 19 + TypeScript
- expo-router (tabs nativas)
- SQLite local (`expo-sqlite` + `drizzle-orm`)
- @tanstack/react-query v5
- expo-notifications + WhatsApp wa.me
- lucide-react-native + Toasts propios

## Comandos rápidos
```bash
npm run start             # expo start --dev-client
npm run db:generate       # drizzle-kit generate + bundle-migrations.js
npx tsc --noEmit          # Chequeo de tipos TypeScript
node scripts/generate-icons.js # Generar iconos
```
