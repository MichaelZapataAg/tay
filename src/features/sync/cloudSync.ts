import { Platform } from 'react-native';
import { db } from '@/db/client';
import { clients, loans, payments, capitalMovements, expenses } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

let isSyncing = false;

export async function syncAll(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isSyncing) return;
  isSyncing = true;

  try {
    // 1. PULL DE LA NUBE A LOCAL
    await pullFromCloud();

    // 2. PUSH DE LOCAL A LA NUBE
    await pushToCloud();

    // Invalidar React Query caches para refrescar la UI
    queryClient.invalidateQueries();
  } catch (err) {
    console.warn('[cloudSync] Sync warning (posiblemente offline):', err);
  } finally {
    isSyncing = false;
  }
}

async function pullFromCloud(): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    const [cRes, lRes, pRes, cmRes, eRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('capital_movements').select('*'),
      supabase.from('expenses').select('*'),
    ]);

    if (cRes.data && cRes.data.length > 0) {
      for (const row of cRes.data) {
        await db
          .insert(clients)
          .values({
            id: row.id,
            name: row.name,
            alias: row.alias,
            phone: row.phone,
            address: row.address,
            notes: row.notes,
            active: Boolean(row.active ?? 1),
            createdAt: row.created_at || nowIso,
            updatedAt: row.updated_at || nowIso,
          })
          .onConflictDoUpdate({
            target: clients.id,
            set: {
              name: row.name,
              alias: row.alias,
              phone: row.phone,
              address: row.address,
              notes: row.notes,
              active: Boolean(row.active ?? 1),
              updatedAt: row.updated_at || nowIso,
            },
          });
      }
    }

    if (lRes.data && lRes.data.length > 0) {
      // Lookup client name map
      const clientMap = new Map((cRes.data || []).map((c: any) => [c.id, c.name]));

      for (const row of lRes.data) {
        const clientName = clientMap.get(row.client_id) || 'Cliente';
        await db
          .insert(loans)
          .values({
            id: row.id,
            clientId: row.client_id,
            clientName,
            initialAmount: row.initial_amount,
            currentCapital: row.current_capital,
            interestRate: row.interest_rate,
            paymentFrequency: row.payment_frequency,
            frequencyDays: row.frequency_days,
            startDate: row.start_date,
            nextDueDate: row.next_due_date,
            notes: row.notes,
            status: row.status,
            createdAt: row.created_at || nowIso,
            updatedAt: row.updated_at || nowIso,
          })
          .onConflictDoUpdate({
            target: loans.id,
            set: {
              clientName,
              currentCapital: row.current_capital,
              interestRate: row.interest_rate,
              paymentFrequency: row.payment_frequency,
              frequencyDays: row.frequency_days,
              nextDueDate: row.next_due_date,
              notes: row.notes,
              status: row.status,
              updatedAt: row.updated_at || nowIso,
            },
          });
      }
    }

    if (pRes.data && pRes.data.length > 0) {
      for (const row of pRes.data) {
        await db
          .insert(payments)
          .values({
            id: row.id,
            loanId: row.loan_id,
            clientId: row.client_id,
            paidAt: row.created_at || nowIso,
            date: row.date,
            interestAmount: row.interest_amount,
            capitalAmount: row.capital_amount ?? 0,
            totalAmount: row.total_amount,
            paymentMethod: row.payment_method || 'efectivo',
            receiptPhotoUri: row.receipt_photo_uri,
            notes: row.notes,
            createdAt: row.created_at || nowIso,
          })
          .onConflictDoNothing();
      }
    }

    if (cmRes.data && cmRes.data.length > 0) {
      for (const row of cmRes.data) {
        await db
          .insert(capitalMovements)
          .values({
            id: row.id,
            type: row.type,
            amount: row.amount,
            date: row.date,
            notes: row.notes,
            createdAt: row.created_at || nowIso,
          })
          .onConflictDoNothing();
      }
    }

    if (eRes.data && eRes.data.length > 0) {
      for (const row of eRes.data) {
        await db
          .insert(expenses)
          .values({
            id: row.id,
            category: row.category,
            amount: row.amount,
            date: row.date,
            notes: row.notes,
            createdAt: row.created_at || nowIso,
          })
          .onConflictDoNothing();
      }
    }
  } catch (err) {
    console.warn('[cloudSync] Error pulling from Supabase:', err);
  }
}

async function pushToCloud(): Promise<void> {
  try {
    const [allClients, allLoans, allPayments, allMovements, allExpenses] =
      await Promise.all([
        db.select().from(clients),
        db.select().from(loans),
        db.select().from(payments),
        db.select().from(capitalMovements),
        db.select().from(expenses),
      ]);

    if (allClients.length > 0) {
      await supabase.from('clients').upsert(
        allClients.map((c: any) => ({
          id: c.id,
          name: c.name,
          alias: c.alias,
          phone: c.phone,
          address: c.address,
          notes: c.notes,
          active: c.active ? 1 : 0,
          updated_at: new Date().toISOString(),
        })),
      );
    }

    if (allLoans.length > 0) {
      await supabase.from('loans').upsert(
        allLoans.map((l: any) => ({
          id: l.id,
          client_id: l.clientId,
          initial_amount: l.initialAmount,
          current_capital: l.currentCapital,
          interest_rate: l.interestRate,
          payment_frequency: l.paymentFrequency,
          frequency_days: l.frequencyDays,
          start_date: l.startDate,
          next_due_date: l.nextDueDate,
          notes: l.notes,
          status: l.status,
          updated_at: new Date().toISOString(),
        })),
      );
    }

    if (allPayments.length > 0) {
      await supabase.from('payments').upsert(
        allPayments.map((p: any) => ({
          id: p.id,
          loan_id: p.loanId,
          client_id: p.clientId,
          date: p.date,
          interest_amount: p.interestAmount,
          capital_amount: p.capitalAmount,
          total_amount: p.totalAmount,
          payment_method: p.paymentMethod,
          receipt_photo_uri: p.receiptPhotoUri,
          notes: p.notes,
          updated_at: new Date().toISOString(),
        })),
      );
    }

    if (allMovements.length > 0) {
      await supabase.from('capital_movements').upsert(
        allMovements.map((m: any) => ({
          id: m.id,
          type: m.type,
          amount: m.amount,
          date: m.date,
          notes: m.notes,
          updated_at: new Date().toISOString(),
        })),
      );
    }

    if (allExpenses.length > 0) {
      await supabase.from('expenses').upsert(
        allExpenses.map((e: any) => ({
          id: e.id,
          category: e.category,
          amount: e.amount,
          date: e.date,
          notes: e.notes,
          updated_at: new Date().toISOString(),
        })),
      );
    }
  } catch (err) {
    console.warn('[cloudSync] Error pushing to Supabase:', err);
  }
}
