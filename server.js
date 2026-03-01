const express = require('express');
const Parser = require('rss-parser');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const app = express();
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'WTAF-Feed/1.0 (RSS Aggregator)' },
  customFields: {
    item: [
      ['media:content',   'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function extractImage(item) {
  const mc = item.mediaContent;
  if (mc) {
    const url = Array.isArray(mc) ? mc[0]?.$?.url : mc.$?.url;
    if (url) return url;
  }
  const mt = item.mediaThumbnail;
  if (mt) {
    const url = Array.isArray(mt) ? mt[0]?.$?.url : mt.$?.url;
    if (url) return url;
  }
  if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  const html = item.contentEncoded || item['content:encoded'] || item.content || item.summary || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
}

function extractContent(item) {
  const raw = item.contentEncoded || item['content:encoded'] || item.content || item.description || item.summary || '';
  if (!raw || typeof raw !== 'string') return null;
  const noScript = raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return noScript.trim().slice(0, 150000) || null;
}

app.use(express.static(path.join(__dirname, 'public')));

const SOURCES = [
  {
    name: 'Platformer',
    url: 'https://www.platformer.news',
    feed: 'https://www.platformer.news/feed/',
    description: "Casey Newton's essential tech newsletter",
    category: 'newsletter',
  },
  {
    name: 'Citation Needed',
    url: 'https://www.citationneeded.news',
    feed: 'https://www.citationneeded.news/rss/',
    description: 'Molly White on crypto and tech skepticism',
    category: 'newsletter',
  },
  {
    name: 'Hell Gate',
    url: 'https://hellgatenyc.com',
    feed: 'https://hellgatenyc.com/all-posts/rss/',
    description: 'Worker-owned NYC local newsroom',
    category: 'newsroom',
  },
  {
    name: 'Link In Bio',
    url: 'https://linkinbio.substack.com',
    feed: 'https://linkinbio.substack.com/feed',
    description: 'Rachel Karten on social media marketing',
    category: 'newsletter',
  },
  {
    name: 'User Mag',
    url: 'https://usermag.co',
    feed: 'https://usermag.co/feed/',
    description: "Taylor Lorenz's newsletter on internet culture",
    category: 'newsletter',
  },
  {
    name: 'Garbage Day',
    url: 'https://www.garbageday.email',
    feed: 'https://rss.beehiiv.com/feeds/owMwaGYU36.xml',
    description: "Ryan Broderick on internet culture and the web",
    category: 'newsletter',
  },
  {
    name: 'Deez Links',
    url: 'https://deezlinks.substack.com',
    feed: 'https://deezlinks.substack.com/feed',
    description: "Delia Cai's delightful and incisive link roundups",
    category: 'newsletter',
  },
  {
    name: '404 Media',
    url: 'https://www.404media.co',
    feed: 'https://www.404media.co/rss/',
    description: 'The best tech newsroom in the world right now',
    category: 'newsroom',
  },
  {
    name: '1-900-HOTDOG',
    url: 'https://www.1900hotdog.com',
    feed: 'https://www.1900hotdog.com/feed/',
    description: 'For anyone who still misses Cracked',
    category: 'newsletter',
  },
  {
    name: 'More Perfect Union',
    url: 'https://perfectunion.us',
    feed: 'https://perfectunion.us/feed/',
    description: 'Emmy-winning nonprofit labor journalism',
    category: 'newsroom',
  },
  {
    name: 'The Handbasket',
    url: 'https://thehandbasket.substack.com',
    feed: 'https://thehandbasket.substack.com/feed',
    description: "Marisa Kabas on Trump administration skullduggery",
    category: 'newsletter',
  },
  {
    name: 'Ken Klippenstein',
    url: 'https://kenklippenstein.substack.com',
    feed: 'https://kenklippenstein.substack.com/feed',
    description: 'Government scoops from a rare independent with real connections',
    category: 'newsletter',
  },
  {
    name: 'Defector',
    url: 'https://defector.com',
    feed: 'https://defector.com/feed/',
    description: 'Amazing writing about sports and more',
    category: 'newsroom',
  },
  {
    name: 'Drop Site News',
    url: 'https://www.dropsitenews.com',
    feed: 'https://www.dropsitenews.com/feed/',
    description: "Ryan Grim's investigative nonprofit outlet",
    category: 'newsroom',
  },
  {
    name: 'Tech Dirt',
    url: 'https://www.techdirt.com',
    feed: 'https://www.techdirt.com/feed/',
    description: "The longest-serving Big Tech watchdog",
    category: 'newsroom',
  },
  {
    name: 'The Present Age',
    url: 'https://www.readtpa.com',
    feed: 'https://www.readtpa.com/feed',
    description: 'Parker Molloy on news and politics',
    category: 'newsletter',
  },
  {
    name: 'The Cut',
    url: 'https://www.thecut.com',
    feed: 'https://www.thecut.com/feeds/flipboard.rss',
    description: "New York Magazine's essential women's interest and culture vertical",
    category: 'newsroom',
  },
  {
    name: 'Vulture',
    url: 'https://www.vulture.com',
    feed: 'https://www.vulture.com/feeds/flipboard.rss',
    description: "New York Magazine's entertainment and culture vertical",
    category: 'newsroom',
  },
  {
    name: 'Intelligencer',
    url: 'https://nymag.com/intelligencer',
    feed: 'http://nymag.com/feeds/intelligencer/flipboard.rss',
    description: "New York Magazine's politics and news vertical",
    category: 'newsroom',
  },
  {
    name: 'Grub Street',
    url: 'https://www.grubstreet.com',
    feed: 'https://www.grubstreet.com/feeds/flipboard.rss',
    description: "New York Magazine's food and restaurant vertical",
    category: 'newsroom',
  },
  {
    name: 'NASA APOD',
    url: 'https://apod.nasa.gov/apod/',
    feed: 'http://apod.nasa.gov/apod.rss',
    description: "A different image of our universe each day with a brief explanation",
    category: 'newsroom',
  },
  {
    name: 'Semafor',
    url: 'https://www.semafor.com',
    feed: 'https://www.semafor.com/rss.xml',
    description: 'Global news with transparent reporting and sourcing',
    category: 'newsroom',
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com',
    feed: 'https://www.technologyreview.com/stories.rss',
    description: "Independent media covering emerging technology and innovation",
    category: 'newsroom',
  },
];

let cache = null;
let cacheTime = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

let tickerCache = null;
let tickerCacheTime = null;
const TICKER_TTL = 30 * 60 * 1000; // 30 minutes

app.get('/api/sources', (req, res) => {
  res.json(SOURCES.map(({ name, url, description, category, feed }) => ({
    name,
    url,
    description,
    category,
    hasRss: !!feed,
  })));
});

// Fetch and validate a single RSS/Atom feed URL (used for user-added sources)
app.get('/api/feed', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return res.status(400).json({ error: 'Only http(s) URLs allowed' });
  }
  try {
    const feed = await parser.parseURL(url.href);
    const name    = feed.title?.trim() || url.hostname;
    const siteUrl = feed.link?.trim()  || url.origin;
    const items = feed.items.slice(0, 8).map(item => ({
      source:    name,
      sourceUrl: siteUrl,
      category:  'custom',
      title:     item.title?.trim(),
      link:      item.link,
      date:      item.isoDate || item.pubDate || null,
      snippet:   (item.contentSnippet || item.summary || '').replace(/\s+/g, ' ').trim().slice(0, 800) || null,
      content:   extractContent(item),
      image:     extractImage(item),
    })).filter(item => item.title && item.link);
    res.json({ name, url: siteUrl, description: feed.description?.trim() || '', items });
  } catch (err) {
    console.error('Custom feed fetch failed:', url.href, err.message);
    res.status(422).json({ error: 'Could not fetch or parse that URL as an RSS/Atom feed.' });
  }
});

app.get('/api/feeds', async (req, res) => {
  const useCache = cache && Date.now() - cacheTime < CACHE_TTL;

  if (useCache) {
    return res.json({ items: cache, cached: true, cachedAt: new Date(cacheTime).toISOString() });
  }

  const feedSources = SOURCES.filter(s => s.feed);
  const allItems = [];
  const failed = [];

  const results = await Promise.allSettled(
    feedSources.map(async source => {
      const feed = await parser.parseURL(source.feed);
      return feed.items.slice(0, 8).map(item => ({
        source: source.name,
        sourceUrl: source.url,
        category: source.category,
        title: item.title?.trim(),
        link: item.link,
        date: item.isoDate || item.pubDate || null,
        snippet: (item.contentSnippet || item.summary || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 800) || null,
        content: extractContent(item),
        image: extractImage(item),
      }));
    })
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') allItems.push(...r.value);
    else failed.push(feedSources[i].name);
  });

  const items = allItems
    .filter(item => item.title && item.link)
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

  cache = items;
  cacheTime = Date.now();

  res.json({ items, failed });
});

// Extract meaningful search keywords from a headline (used as ticker fallback)
function extractKeywords(title) {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','was','are','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','its','it','this','that','these','those','over','into','about','after','before','as','if','he','she','they','we','you','new','says','after','amid','over','what']);
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stop.has(w)).slice(0, 4);
}

// Generate a cable-news-style ticker: one summary per topic, with keywords for filtering
app.get('/api/ticker', async (req, res) => {
  if (tickerCache && Date.now() - tickerCacheTime < TICKER_TTL) {
    return res.json({ topics: tickerCache, cached: true });
  }

  // Need feed cache to exist; if not, tell the client to retry later
  if (!cache) return res.json({ topics: null });

  // Use most recent items from whatever's in the cache
  const items = cache.slice(0, 30);
  if (!items.length) return res.json({ topics: null });

  const titles = items.map(i => i.title).join('\n');

  let topics;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `Group these headlines into 5–7 broad topics. For each topic write one punchy 6–10 word summary. Return ONLY a JSON array, no markdown, no explanation:\n[{"summary":"...","keywords":["term1","term2","term3"]}]\nKeywords (2–5 per topic) should be the best search terms to find related headlines.\n\nHeadlines:\n${titles}`,
          }],
        }),
      });
      const data = await response.json();
      const raw = data?.content?.[0]?.text?.trim().replace(/^```json\s*|\s*```$/g, '') || '';
      topics = JSON.parse(raw);
    } catch (err) {
      console.error('Ticker Claude call failed:', err.message);
    }
  }

  // Fallback: one item per headline
  if (!topics) {
    topics = items.slice(0, 8).map(item => ({
      summary: item.title.replace(/\s+/g, ' ').trim(),
      keywords: extractKeywords(item.title),
    }));
  }

  tickerCache = topics;
  tickerCacheTime = Date.now();
  res.json({ topics });
});

// Check whether a URL can be embedded in an iframe
// by doing a HEAD request and inspecting X-Frame-Options / CSP frame-ancestors
app.get('/api/can-embed', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return res.status(400).json({ error: 'Only http(s) URLs allowed' });
  }
  try {
    const response = await fetch(url.href, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'WTAF-Feed/1.0 (RSS Aggregator)' },
      redirect: 'follow',
    });
    const xfo = response.headers.get('x-frame-options') || '';
    const csp = response.headers.get('content-security-policy') || '';
    const xfoBlocked = /deny|sameorigin/i.test(xfo);
    // block if frame-ancestors is present but doesn't allow all origins via *
    const cspBlocked = /frame-ancestors\s+[^;*]/.test(csp) && !/frame-ancestors[^;]*\*/i.test(csp);
    res.json({ canEmbed: !xfoBlocked && !cspBlocked });
  } catch (err) {
    console.error('can-embed check failed:', url.href, err.message);
    res.json({ canEmbed: true }); // assume embeddable if check fails
  }
});

// Extract main article content from a URL (readability)
app.get('/api/article', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url query' });
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return res.status(400).json({ error: 'Only http(s) URLs allowed' });
  }

  try {
    const dom = await JSDOM.fromURL(url.href, {
      timeout: 10000,
      userAgent: 'WTAF-Feed/1.0 (RSS Aggregator; +https://github.com/xujenna/wtaf)',
    });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article || !article.content) {
      return res.status(422).json({ error: 'Could not extract article content' });
    }
    res.json({ title: article.title, content: article.content });
  } catch (err) {
    console.error('Article extract failed:', url.href, err.message);
    res.status(500).json({ error: 'Failed to fetch or parse article' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WTAF Feed running at http://localhost:${PORT}`));
