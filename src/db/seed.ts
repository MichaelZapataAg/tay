import { sql } from 'drizzle-orm';
import { db } from './client';
import { clients, loans, payments, capitalMovements } from './schema';
import { newId } from '@/lib/id';

export async function seedIfEmpty() {
  const existingClients = (await db.all(sql`SELECT count(*) as count FROM clients;`)) as {
    count: number;
  }[];

  if (existingClients[0]?.count > 0) {
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Helper para fechas YYYY-MM-DD
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

  // Capital inicial inyectado por Tay: $10.000.000
  await db.insert(capitalMovements).values({
    id: newId(),
    type: 'inyeccion',
    amount: 10000000,
    date: dMinus30Str,
    notes: 'Capital inicial para fondo de préstamos Tay',
    createdAt: dMinus30Str,
  });

  // Cliente 1: Carlos Mendoza (Quincenal 15%, le toca pagar HOY)
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
    interestRate: 15.0, // 15% quincenal -> $300.000
    paymentFrequency: 'quincenal',
    frequencyDays: 15,
    loanType: 'solo_interes',
    startDate: dMinus15Str,
    nextDueDate: todayStr, // Toca cobrar hoy
    status: 'activo',
    notes: 'Para comprar repuestos de motos.',
    createdAt: dMinus15Str,
    updatedAt: dMinus15Str,
  });

  // Cliente 2: Valentina Gómez (Mensual 20%, Vencido hace 2 días)
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
    interestRate: 20.0, // 20% mensual -> $300.000
    paymentFrequency: 'mensual',
    frequencyDays: 30,
    loanType: 'solo_interes',
    startDate: dMinus30Str,
    nextDueDate: dMinus2Str, // Vencido hace 2 días
    status: 'activo',
    notes: 'Surtido de tintes y productos capilares.',
    createdAt: dMinus30Str,
    updatedAt: dMinus30Str,
  });

  // Cliente 3: Andrés Restrepo (Quincenal 10%, Próximo en 5 días + ya hizo un pago previo con abono a capital)
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
    currentCapital: 2500000, // Abonó $500.000 de capital
    interestRate: 10.0, // 10% quincenal sobre $2.5M -> $250.000
    paymentFrequency: 'quincenal',
    frequencyDays: 15,
    loanType: 'solo_interes',
    startDate: dMinus30Str,
    nextDueDate: dPlus5Str, // Próximo en 5 días
    status: 'activo',
    notes: 'Inversión en freidora industrial.',
    createdAt: dMinus30Str,
    updatedAt: dMinus15Str,
  });

  // Pago registrado previo de Andrés: Pagó $300.000 de interés + $500.000 abono a capital = $800.000
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
