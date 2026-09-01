import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

/**
 * CLIENTES (Prestatarios / Deudores)
 */
export const clients = sqliteTable(
  'clients',
  {
    id: text('id').primaryKey(), // UUID v7
    name: text('name').notNull(),
    alias: text('alias'), // Apodo o descripción corta
    phone: text('phone'), // Celular / WhatsApp
    address: text('address'),
    notes: text('notes'), // Referencias, acuerdos, etc.
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('clients_name_idx').on(table.name),
    index('clients_active_idx').on(table.active),
  ],
);

/**
 * PRÉSTAMOS
 */
export const loans = sqliteTable(
  'loans',
  {
    id: text('id').primaryKey(), // UUID v7
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    clientName: text('client_name').notNull(), // Snapshot del nombre
    initialAmount: integer('initial_amount').notNull(), // Capital original prestado (pesos COP)
    currentCapital: integer('current_capital').notNull(), // Saldo de capital restante por cobrar
    interestRate: real('interest_rate').notNull(), // Porcentaje de interés acordado (ej. 15.0 para 15%)
    paymentFrequency: text('payment_frequency').notNull(), // 'quincenal' | 'mensual' | 'semanal' | 'personalizado_dias'
    frequencyDays: integer('frequency_days').notNull().default(15), // Días entre cortes (15, 30, 7, 20...)
    loanType: text('loan_type').notNull().default('solo_interes'), // 'solo_interes' | 'cuota_fija'
    startDate: text('start_date').notNull(), // YYYY-MM-DD (fecha en que se desembolsó)
    nextDueDate: text('next_due_date').notNull(), // YYYY-MM-DD (próxima fecha en que le toca pagar)
    status: text('status').notNull().default('activo'), // 'activo' | 'pagado' | 'cancelado'
    notes: text('notes'), // Descripción o notas del préstamo
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('loans_client_idx').on(table.clientId),
    index('loans_status_idx').on(table.status),
    index('loans_next_due_date_idx').on(table.nextDueDate),
  ],
);

/**
 * PAGOS / RECAUDOS
 * Separa estrictamente el Interés (Utilidad de Tay) del Abono a Capital (Fondo de Préstamos).
 */
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(), // UUID v7
    loanId: text('loan_id')
      .notNull()
      .references(() => loans.id, { onDelete: 'restrict' }),
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    paidAt: text('paid_at').notNull(), // Fecha y hora del pago (ISO)
    date: text('date').notNull(), // YYYY-MM-DD (día en que se computa el recaudo)
    periodCovered: text('period_covered'), // Ej: "15 Ago - 30 Ago"
    interestAmount: integer('interest_amount').notNull().default(0), // Utilidad de Tay (pesos COP)
    capitalAmount: integer('capital_amount').notNull().default(0), // Abono a capital prestado (pesos COP)
    totalAmount: integer('total_amount').notNull(), // interestAmount + capitalAmount
    paymentMethod: text('payment_method').notNull().default('efectivo'), // 'efectivo' | 'nequi' | 'daviplata' | 'bancolombia' | 'otro'
    receiptPhotoUri: text('receipt_photo_uri'), // Foto comprobante local
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('payments_loan_idx').on(table.loanId),
    index('payments_client_idx').on(table.clientId),
    index('payments_date_idx').on(table.date),
  ],
);

/**
 * MOVIMIENTOS DE CAPITAL DE TAY
 * Registro de inyecciones al fondo de préstamos o retiros de capital/utilidades.
 */
export const capitalMovements = sqliteTable(
  'capital_movements',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // 'inyeccion' | 'retiro_capital' | 'retiro_utilidad'
    amount: integer('amount').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('capital_movements_date_idx').on(table.date),
    index('capital_movements_type_idx').on(table.type),
  ],
);

/**
 * GASTOS OPERATIVOS
 */
export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(), // 'transporte', 'papeleria', 'llamadas', 'comision', 'otro'
    amount: integer('amount').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('expenses_date_idx').on(table.date),
  ],
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type CapitalMovement = typeof capitalMovements.$inferSelect;
export type NewCapitalMovement = typeof capitalMovements.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
