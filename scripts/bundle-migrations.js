#!/usr/bin/env node
/**
 * Genera src/db/migrations/migrations.js con el SQL inlineado como strings.
 * Metro no importa .sql de forma uniforme, así que el migrator manual
 * (src/db/migrate.ts) consume este bundle. Correr después de drizzle-kit generate
 * (ya encadenado en `npm run db:generate`).
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'db', 'migrations');
if (!fs.existsSync(path.join(dir, 'meta', '_journal.json'))) {
  console.log('No journal found yet.');
  process.exit(0);
}
const journal = JSON.parse(fs.readFileSync(path.join(dir, 'meta', '_journal.json'), 'utf8'));

const parts = [];
const keys = [];
for (const entry of journal.entries) {
  const key = `m${String(entry.idx).padStart(4, '0')}`;
  const sql = fs.readFileSync(path.join(dir, `${entry.tag}.sql`), 'utf8');
  parts.push(`const ${key} = ${JSON.stringify(sql)};`);
  keys.push(key);
}

const out = `// GENERADO por scripts/bundle-migrations.js — no editar a mano.
import journal from './meta/_journal.json';

${parts.join('\n\n')}

export default {
  journal,
  migrations: {
    ${keys.join(',\n    ')},
  },
};
`;

fs.writeFileSync(path.join(dir, 'migrations.js'), out);
console.log(`migrations.js: ${keys.length} migración(es) inlineada(s).`);
