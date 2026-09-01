import { Platform } from 'react-native';
import { sql } from 'drizzle-orm';
import { db } from './client';
import { clients, loans, payments, capitalMovements } from './schema';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/id';

export async function seedIfEmpty() {
  const now = new Date();
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(now);
  const dMinus15 = new Date(now);
  dMinus15.setDate(dMinus15.getDate() - 15);
  const dMinus15Str = formatDate(dMinus15);

  const dMinus30 = new Date(now);
  dMinus30.setDate(dMinus30.getDate() - 30);
  const dMinus30Str = formatDate(dMinus30);

  const dPlus5 = new Date(now);
  dPlus5.setDate(dPlus5.getDate() + 5);
  const dPlus5Str = formatDate(dPlus5);

  const dMinus2 = new Date(now);
  dMinus2.setDate(dMinus2.getDate() - 2);
  const dMinus2Str = formatDate(dMinus2);

  if (Platform.OS === 'web') {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) return;

    // Seed to Supabase
    await supabase.from('capital_movements').insert({
      id: newId(),
      type: 'inyeccion',
      amount: 10000000,
      date: dMinus30Str,
      notes: 'Capital inicial para fondo de préstamos Tay',
      created_at: dMinus30Str,
    });

    const client1Id = newId();
    await supabase.from('clients').insert({
      id: client1Id,
      name: 'Carlos Mendoza',
      alias: 'Carlitos Taller',
      phone: '3145678901',
      address: 'Calle 45 # 12-34',
      notes: 'Dueño del taller de motos. Muy puntual.',
      active: 1,
      created_at: dMinus30Str,
      updated_at: dMinus30Str,
    });

    const loan1Id = newId();
    await supabase.from('loans').insert({
      id: loan1Id,
      client_id: client1Id,
      initial_amount: 2000000,
      current_capital: 2000000,
      interest_rate: 15.0,
      payment_frequency: 'quincenal',
      frequency_days: 15,
      start_date: dMinus15Str,
      next_due_date: todayStr,
      status: 'activo',
      notes: 'Para comprar repuestos de motos.',
      created_at: dMinus15Str,
      updated_at: dMinus15Str,
    });

    const client2Id = newId();
    await supabase.from('clients').insert({
      id: client2Id,
      name: 'Valentina Gómez',
      alias: 'Valen Peluquería',
      phone: '3209876543',
      address: 'Cra 80 # 25-10',
      notes: 'Local en el centro comercial.',
      active: 1,
      created_at: dMinus30Str,
      updated_at: dMinus30Str,
    });

    const loan2Id = newId();
    await supabase.from('loans').insert({
      id: loan2Id,
      client_id: client2Id,
      initial_amount: 1500000,
      current_capital: 1500000,
      interest_rate: 20.0,
      payment_frequency: 'mensual',
      frequency_days: 30,
      start_date: dMinus30Str,
      next_due_date: dMinus2Str,
      status: 'activo',
      notes: 'Surtido de tintes y productos capilares.',
      created_at: dMinus30Str,
      updated_at: dMinus30Str,
    });

    const client3Id = newId();
    await supabase.from('clients').insert({
      id: client3Id,
      name: 'Andrés Restrepo',
      alias: 'Andrés Arepas',
      phone: '3112345678',
      address: 'Barrio Robledo',
      notes: 'Negocio de comidas rápidas.',
      active: 1,
      created_at: dMinus30Str,
      updated_at: dMinus30Str,
    });

    const loan3Id = newId();
    await supabase.from('loans').insert({
      id: loan3Id,
      client_id: client3Id,
      initial_amount: 3000000,
      current_capital: 2500000,
      interest_rate: 10.0,
      payment_frequency: 'quincenal',
      frequency_days: 15,
      start_date: dMinus30Str,
      next_due_date: dPlus5Str,
      status: 'activo',
      notes: 'Inversión en freidora industrial.',
      created_at: dMinus30Str,
      updated_at: dMinus15Str,
    });

    await supabase.from('payments').insert({
      id: newId(),
      loan_id: loan3Id,
      client_id: client3Id,
      date: dMinus15Str,
      interest_amount: 300000,
      capital_amount: 500000,
      total_amount: 800000,
      payment_method: 'nequi',
      notes: 'Pago puntual por Nequi con abono a capital.',
      created_at: `${dMinus15Str}T14:30:00.000Z`,
    });

    return;
  }

  const existingClients = (await db.all(sql`SELECT count(*) as count FROM clients;`)) as {
    count: number;
  }[];

  if (existingClients[0]?.count > 0) {
    return;
  }

  // Capital inicial inyectado por Tay: $10.000.000
  await db.insert(capitalMovements).values({
    id: newId(),
    type: 'inyeccion',
    amount: 10000000,
    date: dMinus30Str,
    notes: 'Capital inicial para fondo de préstamos Tay',
    createdAt: dMinus30Str,
  });

  // Cliente 1: Carlos Mendoza
  const client1Id = newId();
  await db.insert(clients).values({
    id: client1Id,
    name: 'Carlos Mendoza',
    alias: 'Carlitos Taller',
    phone: '3145678901',
    address: 'Calle 45 # 12-34',
    notes: 'Dueño del taller de motos. Muy puntual.',
    active: true,
    createdAt: dMinus30Str,
    updatedAt: dMinus30Str,
  });

  const loan1Id = newId();
  await db.insert(loans).values({
    id: loan1Id,
    clientId: client1Id,
    clientName: 'Carlos Mendoza',
    initialAmount: 2000000,
    currentCapital: 2000000,
    interestRate: 15.0,
    paymentFrequency: 'quincenal',
    frequencyDays: 15,
    loanType: 'solo_interes',
    startDate: dMinus15Str,
    nextDueDate: todayStr,
    status: 'activo',
    notes: 'Para comprar repuestos de motos.',
    createdAt: dMinus15Str,
    updatedAt: dMinus15Str,
  });

  // Cliente 2: Valentina Gómez
  const client2Id = newId();
  await db.insert(clients).values({
    id: client2Id,
    name: 'Valentina Gómez',
    alias: 'Valen Peluquería',
    phone: '3209876543',
    address: 'Cra 80 # 25-10',
    notes: 'Local en el centro comercial.',
    active: true,
    createdAt: dMinus30Str,
    updatedAt: dMinus30Str,
  });

  const loan2Id = newId();
  await db.insert(loans).values({
    id: loan2Id,
    clientId: client2Id,
    clientName: 'Valentina Gómez',
    initialAmount: 1500000,
    currentCapital: 1500000,
    interestRate: 20.0,
    paymentFrequency: 'mensual',
    frequencyDays: 30,
    loanType: 'solo_interes',
    startDate: dMinus30Str,
    nextDueDate: dMinus2Str,
    status: 'activo',
    notes: 'Surtido de tintes y productos capilares.',
    createdAt: dMinus30Str,
    updatedAt: dMinus30Str,
  });

  // Cliente 3: Andrés Restrepo
  const client3Id = newId();
  await db.insert(clients).values({
    id: client3Id,
    name: 'Andrés Restrepo',
    alias: 'Andrés Arepas',
    phone: '3112345678',
    address: 'Barrio Robledo',
    notes: 'Negocio de comidas rápidas.',
    active: true,
    createdAt: dMinus30Str,
    updatedAt: dMinus30Str,
  });

  const loan3Id = newId();
  await db.insert(loans).values({
    id: loan3Id,
    clientId: client3Id,
    clientName: 'Andrés Restrepo',
    initialAmount: 3000000,
    currentCapital: 2500000,
    interestRate: 10.0,
    paymentFrequency: 'quincenal',
    frequencyDays: 15,
    loanType: 'solo_interes',
    startDate: dMinus30Str,
    nextDueDate: dPlus5Str,
    status: 'activo',
    notes: 'Inversión en freidora industrial.',
    createdAt: dMinus30Str,
    updatedAt: dMinus15Str,
  });

  await db.insert(payments).values({
    id: newId(),
    loanId: loan3Id,
    clientId: client3Id,
    paidAt: `${dMinus15Str}T14:30:00.000Z`,
    date: dMinus15Str,
    periodCovered: 'Primera quincena',
    interestAmount: 300000,
    capitalAmount: 500000,
    totalAmount: 800000,
    paymentMethod: 'nequi',
    notes: 'Pago puntual por Nequi con abono a capital.',
    createdAt: `${dMinus15Str}T14:30:00.000Z`,
  });
}
