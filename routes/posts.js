const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

class ValidationError extends Error {}

function requireText(value, label, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new ValidationError(`${label} is required.`);
  if (text.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer.`);
  return text;
}

function readPostForm(body = {}) {
  return {
    title: typeof body.title === 'string' ? body.title : '',
    author: typeof body.author === 'string' ? body.author : '',
    body: typeof body.body === 'string' ? body.body : '',
  };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function listPosts() {
  const { rows } = await pool.query(`
    SELECT p.*,
      (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p
    ORDER BY p.created_at DESC
  `);
  return rows;
}

async function findPost(id) {
  if (!isUuid(id)) return null;
  const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listComments(postId) {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
    [postId]
  );
  return rows;
}

router.get('/', (req, res) => {
  res.render('home', {
    title: 'Getting to Know Me',
    active: 'home',
  });
});

router.get('/board', async (req, res) => {
  res.render('board', {
    title: 'Board',
    active: 'board',
    posts: await listPosts(),
    error: null,
    values: {},
  });
});

router.post('/posts', async (req, res) => {
  const values = readPostForm(req.body);

  try {
    const title = requireText(values.title, 'Title', 120);
    const author = requireText(values.author, 'Your name', 40);
    const body = requireText(values.body, 'Message', 2000);

    const { rows } = await pool.query(
      'INSERT INTO posts (title, author, body) VALUES ($1, $2, $3) RETURNING id',
      [title, author, body]
    );

    res.redirect(`/posts/${rows[0].id}`);
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    res.status(400).render('board', {
      title: 'Board',
      active: 'board',
      posts: await listPosts(),
      error: err.message,
      values,
    });
  }
});

router.get('/posts/:id', async (req, res, next) => {
  const post = await findPost(req.params.id);
  if (!post) return next();

  res.render('post', {
    title: post.title,
    active: 'board',
    post,
    comments: await listComments(post.id),
    error: null,
    values: {},
  });
});

router.post('/posts/:id/comments', async (req, res, next) => {
  const post = await findPost(req.params.id);
  if (!post) return next();

  const values = {
    author: typeof req.body.author === 'string' ? req.body.author : '',
    body: typeof req.body.body === 'string' ? req.body.body : '',
  };

  try {
    const author = requireText(values.author, 'Your name', 40);
    const body = requireText(values.body, 'Comment', 1000);

    await pool.query(
      'INSERT INTO comments (post_id, author, body) VALUES ($1, $2, $3)',
      [post.id, author, body]
    );

    res.redirect(`/posts/${post.id}#comments`);
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    res.status(400).render('post', {
      title: post.title,
      active: 'board',
      post,
      comments: await listComments(post.id),
      error: err.message,
      values,
    });
  }
});

module.exports = router;
