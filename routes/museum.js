const express = require('express');

const router = express.Router();

const API_URL = 'https://api.artic.edu/api/v1/artworks/search';
const IMAGE_URL = 'https://www.artic.edu/iiif/2';
const FIELDS = 'id,title,artist_display,date_display,image_id,department_title';
const imageCache = new Map();

router.get('/', async (req, res) => {
  const query = String(req.query.q || '').trim().slice(0, 80) || 'landscape';
  const url = new URL(API_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '12');
  url.searchParams.set('fields', FIELDS);

  let artworks = [];
  let total = 0;
  let error = null;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Museum API responded with ${response.status}`);

    const data = await response.json();

    artworks = (data.data || []).map((art) => ({
      ...art,
      image: art.image_id ? `${IMAGE_URL}/${art.image_id}/full/600,/0/default.jpg` : null,
    }));
    total = data.pagination?.total || artworks.length;
  } catch (err) {
    console.error('Museum API error:', err.message);
    error = 'The museum is not answering right now. Give it a moment and try again.';
  }

  res.render('museum', {
    title: 'Museum',
    active: 'museum',
    query,
    artworks,
    total,
    error,
  });
});

router.get('/image/:id', async (req, res) => {
  const id = req.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.sendStatus(404);

  const cached = imageCache.get(id);
  if (cached) {
    res.set('Cache-Control', 'public, max-age=86400');
    return res.type('image/jpeg').send(cached);
  }

  try {
    const response = await fetch(`${IMAGE_URL}/${id}/full/600,/0/default.jpg`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.artic.edu/',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error(`Museum image ${id} upstream status ${response.status}`);
      return res.sendStatus(502);
    }

    const image = Buffer.from(await response.arrayBuffer());
    imageCache.set(id, image);
    if (imageCache.size > 60) imageCache.delete(imageCache.keys().next().value);

    res
      .set('Cache-Control', 'public, max-age=86400')
      .type(response.headers.get('content-type') || 'image/jpeg')
      .send(image);
  } catch (err) {
    console.error('Museum image error:', err.message);
    res.sendStatus(502);
  }
});

module.exports = router;
