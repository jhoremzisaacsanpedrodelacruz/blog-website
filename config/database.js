const { Pool } = require('pg');

const rawConnectionString = process.env.DATABASE_URL;

// pg prints a deprecation warning for URLs that use sslmode=require/prefer/verify-ca.
// TLS is configured explicitly below, so remove the parameter and keep the logs quiet.
function withoutSslMode(url) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch {
    return url;
  }
}

function isLocalHost(url) {
  if (!url) return true;
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

const pool = new Pool({
  connectionString: withoutSslMode(rawConnectionString),
  ssl: isLocalHost(rawConnectionString) ? false : { rejectUnauthorized: false },
});

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title varchar(120) NOT NULL,
      author varchar(40) NOT NULL,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author varchar(40) NOT NULL,
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS comments_post_id_created_at_idx
      ON comments (post_id, created_at);
  `);

  await pool.query(
    `INSERT INTO posts (id, title, author, body, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [
      'e694b0ee-91f2-4c79-bd79-6c01900f30e2',
      'Welcome To My Board!',
      'Jhoremz Dela Cruz',
      'Leave a comment at the very Top!',
      '2026-11-04T16:15:36.390Z',
    ]
  );
}

module.exports = { pool, setup };
