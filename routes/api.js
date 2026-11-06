const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

router.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

router.get('/posts', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.id, p.title, p.author, p.created_at,
      (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p
    ORDER BY p.created_at DESC
  `);

  res.json(rows.map((post) => ({
    id: post.id,
    title: post.title,
    author: post.author,
    createdAt: post.created_at,
    commentCount: post.comment_count,
  })));
});

router.get('/posts/:id', async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
  const post = rows[0];
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = await pool.query(
    'SELECT id, author, body, created_at FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
    [post.id]
  );

  res.json({
    id: post.id,
    title: post.title,
    author: post.author,
    createdAt: post.created_at,
    body: post.body,
    comments: comments.rows.map((comment) => ({
      id: comment.id,
      author: comment.author,
      body: comment.body,
      createdAt: comment.created_at,
    })),
  });
});

module.exports = router;
