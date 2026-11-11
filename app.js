require('dotenv').config();

const express = require('express');
const path = require('path');
const { setup } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.locals.siteName = "Jhoremz's Blog Board";

// FIX FOR THE TIMEZOME using the USA timezone, need to be GMT + 8 for philippines C:
const siteTimeZone = process.env.SITE_TIME_ZONE || 'Asia/Manila';
const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: siteTimeZone,
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'short',
});

app.locals.formatDate = (value) => dateFormatter.format(new Date(value));
app.locals.excerpt = (text) => {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  return flat.length > 220 ? `${flat.slice(0, 220).trimEnd()}…` : flat;
};

app.use('/', require('./routes/posts'));
app.use('/museum', require('./routes/museum'));
app.use('/about', require('./routes/about'));
app.use('/api/public', require('./routes/api'));

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    status: 404,
    message: 'That page does not exist. It may have moved, or the link might be wrong.',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    title: 'Something went wrong',
    status: err.status || 500,
    message: 'The server hit an unexpected problem. Please try again in a moment.',
  });
});

setup()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Jhoremz's Blog Board is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  });
