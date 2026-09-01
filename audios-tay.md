# Audios de Tay — Transcripciones y Requerimientos

Transcritos localmente con `whisper-cli` (modelo `base` en español). Los audios originales provienen de `~/Downloads/WhatsApp Audio 2026-08-31 at 20.39.*.opus`.

---

## 1. Audio 1 (20:39:06) — Porcentajes, Frecuencia y Separación de Capital vs Intereses

> *"Son préstamos, la idea sería que me puedas permitir como editar el porcentaje porque varía. Y también varía que hay unos que son cada 20 días y otros que son cada 15 días [quincenales] o mensuales. También puede ser del 20%, el 15%, puede haber muchos porcentajes. Sería como tener yo como un espacio donde sea como el capital, que es lo que yo vuelvo y presto, ¿cierto? Que volví lo recibo y aparte del ingreso que es el interés. El interés si me lo puedo decir así es mío. Cierto."*

### Puntos clave del Audio 1:
1. **Tasa de interés variable y editable**: Cada préstamo puede tener un porcentaje acordado distinto (ej. 10%, 15%, 20%, etc.). No es una tasa fija global; debe poder digitarse o seleccionarse al crear/editar el préstamo.
2. **Frecuencias de cobro variables**:
   - **Quincenal** (cada 15 días)
   - **Mensual** (cada 30 días / mes)
   - **Personalizado / Cada N días** (ej. cada 20 días, semanal cada 7 días).
3. **Separación contable estricta: Capital vs Intereses**:
   - **Capital (Fondo prestable)**: El dinero prestado que al cobrarse regresa al capital de trabajo para volverse a prestar ("lo que yo vuelvo y presto").
   - **Intereses (Ingreso / Utilidad real de Tay)**: La ganancia neta generada por el préstamo ("el interés sí es mío").

---

## 2. Audio 2 (20:39:38) — Ficha del Cliente, Descripción y Fechas

> *"Pues que tenga como el espacio de la descripción, obviamente pues de la persona, la información, la fecha, así, los datos del nombre, pues no decía algo que, lo que yo entienda que sí, y la fecha de, la fecha de inicio de cuando se prestó, la fecha en que se prestó y pues qué, obvio, qué diga, se prestó quincenal o hay unos qué diga como que se prestó, no, o si quincenal o cada interés como te diga ahí."*

### Puntos clave del Audio 2:
1. **Datos del cliente / Deudor**:
   - Nombre completo y alias/apodo.
   - Teléfono / WhatsApp (para recordatorios con 1 tap).
   - Notas / Descripción adicional (ej. referencias, dónde vive o trabaja, acuerdos especiales).
2. **Datos del préstamo**:
   - Fecha de desembolso / inicio (`startDate`).
   - Monto prestado / capital inicial.
   - Frecuencia y modalidad (pago de sólo interés periódico, abonos a capital, o cuota fija).
   - Próxima fecha de vencimiento / corte calculada automáticamente según la frecuencia.

---

## 3. Audio 3 (20:41:16) — Notificaciones y Alertas de Cobro

> *"La idea sería que cuando a la persona le toca pagar interés ese día me avise, me mandé como una notificación de que tal persona le toca hoy."*

### Puntos clave del Audio 3:
1. **Notificación local en el celular**:
   - Notificación programada en el dispositivo para la fecha del corte (ej. 8:00 AM): *"Hoy cobra interés a [Nombre Cliente] por $[Valor]"*.
2. **Dashboard / Vista "Cobros de Hoy"**:
   - Al abrir la app, lo primero que ve Tay es la lista de cobranzas del día: a quién le toca pagar hoy, a quién se le venció ayer (mora), y quiénes vienen en los próximos días.
3. **Acción rápida de cobro y recordatorio por WhatsApp**:
   - Botón directo para enviar recordatorio con plantilla cordial por WhatsApp.
   - Botón "Registrar Cobro" que separa automáticamente interés y abono a capital.

---

## Comparativa con la familia de apps (Susana, Natalia, Kelly)

| App | Dueña | Negocio | Particularidad |
|---|---|---|---|
| **natalia** | Natalia | Arepas | Ventas, productos, devoluciones, facturación térmica ESC/POS |
| **susana** | Susana | Parqueadero | Turnos 12h/horas, mensualidades, fotos 4 ángulos, caja celador |
| **kelly** | Kelly | KR Nails | Citas, clientas, fiados, recordatorios dobles (push + WhatsApp) |
| **tay** | Tay | Micropréstamos | Préstamos, clientes, separación Capital vs Interés, notificaciones de corte, cobro WhatsApp |
