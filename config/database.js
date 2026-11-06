const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
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
      'Hello',
      'Jho',
      'JHEOEIFOF',
      '2026-11-04T16:15:36.390Z',
    ]
  );
}

module.exports = { pool, setup };
