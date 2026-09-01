const { Client } = require('pg');

const schemaSql = `
-- TABLA: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: loans
CREATE TABLE IF NOT EXISTS public.loans (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  initial_amount INTEGER NOT NULL,
  current_capital INTEGER NOT NULL,
  interest_rate REAL NOT NULL,
  payment_frequency TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  next_due_date TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: payments
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  interest_amount INTEGER NOT NULL,
  capital_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  receipt_photo_uri TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: capital_movements
CREATE TABLE IF NOT EXISTS public.capital_movements (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLA: app_config
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inicializar PIN por defecto en app_config
INSERT INTO public.app_config (key, value)
VALUES ('pin', '0110')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS pero permitir operaciones anónimas con anon key para este proyecto personal
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Policies para clients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Allow all clients') THEN
    CREATE POLICY "Allow all clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Policies para loans
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Allow all loans') THEN
    CREATE POLICY "Allow all loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Policies para payments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Allow all payments') THEN
    CREATE POLICY "Allow all payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Policies para capital_movements
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'capital_movements' AND policyname = 'Allow all capital_movements') THEN
    CREATE POLICY "Allow all capital_movements" ON public.capital_movements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Policies para expenses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Allow all expenses') THEN
    CREATE POLICY "Allow all expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Policies para app_config
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_config' AND policyname = 'Allow all app_config') THEN
    CREATE POLICY "Allow all app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

async function runMigration() {
  const client = new Client({
    host: 'db.qhqmopbxxtnxpchhibto.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'LYy2OtEWdjCPKnGQ',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL...');
    await client.query(schemaSql);
    console.log('✓ All tables and RLS policies created successfully in Supabase!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await client.end();
  }
}

runMigration();
