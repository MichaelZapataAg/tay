const { Client } = require('pg');

async function testConnection() {
  const hosts = [
    'db.qhqmopbxxtnxpchhibto.supabase.co',
    'aws-0-us-east-1.pooler.supabase.com'
  ];

  for (const host of hosts) {
    try {
      console.log(`Connecting to ${host}...`);
      const user = host.includes('pooler') ? 'postgres.qhqmopbxxtnxpchhibto' : 'postgres';
      const port = host.includes('pooler') ? 6543 : 5432;
      const client = new Client({
        host,
        port,
        user,
        password: 'LYy2OtEWdjCPKnGQ',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      await client.connect();
      const res = await client.query('SELECT NOW() as now;');
      console.log(`✓ Connected to ${host}! DB time:`, res.rows[0].now);
      await client.end();
      return host;
    } catch (err) {
      console.error(`✗ Error connecting to ${host}:`, err.message);
    }
  }
}

testConnection();
