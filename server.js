require('dotenv').config();
const express = require('express');
const Parser = require('rss-parser');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const Anthropic = require('@anthropic-ai/sdk').default;

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
    name: 'Atlantic Yards Report',
    url: 'https://atlanticyardsreport.blogspot.com',
    feed: 'https://atlanticyardsreport.blogspot.com/feeds/posts/default?alt=rss',
    description: 'Coverage of Atlantic Yards/Pacific Park development in Brooklyn',
    category: 'nyc',
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

// Keyword-based label classification
const LABEL_KEYWORDS = {
  politics: ['trump','biden','congress','senate','white house','election','democrat','republican','government','president','political','policy','vote','legislation','supreme court'],
  nyc:      ['new york','nyc','brooklyn','manhattan','queens','bronx','staten island','city hall','nypd','mta','subway'],
  culture:  ['music','film','movie','book','art ','entertainment','celebrity','fashion','food','restaurant','award','festival','concert','album'],
  media:    ['media ','newspaper','journalist','journalism','newsletter','podcast','television','streaming','netflix','social media','twitter','facebook','instagram','youtube'],
  science:  ['science','research','study','climate',' space ','nasa','health','medical','disease','environment','species','planet','discovery'],
  tech:     ['tech','technology',' ai ','artificial intelligence','software','apple','google','microsoft','amazon','startup','crypto','bitcoin'],
};

function classifyLabels(title) {
  const lower = ` ${title.toLowerCase()} `;
  return Object.entries(LABEL_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => lower.includes(kw)))
    .map(([label]) => label);
}

const VALID_TOPICS = new Set(['tech', 'politics', 'nyc', 'culture', 'media', 'science']);

// One Claude call: generate ticker topic groups with real summsummaries + classify articles
async function analyzeWithClaude(items) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = new Anthropic();

  const articleList = items.map((item, i) => {
    const snippet = item.snippet ? ` — ${item.snippet.slice(0, 150)}` : '';
    return `${i}: ${item.title}${snippet}`;
  }).join('\n');

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You analyze a set of recent news articles. Return a JSON object with two fields:

"labels": maps each article index (string) to an array of topic labels. Use only: tech, politics, nyc, culture, media, science.
  - tech: AI, software, hardware, internet companies, cybersecurity, startups, crypto
  - politics: government, elections, politicians, legislation, policy, courts, war, diplomacy
  - nyc: New York City local news, MTA/subway, NYC neighborhoods or events
  - culture: film, TV, music, celebrities, sports, fashion, food, books, entertainment, awards. This includes celebrity news, crime involving celebrities, reality TV, pop culture.
  - media: ONLY news about the journalism/media industry itself — newsrooms, reporters, newspapers, broadcasting companies, media mergers, layoffs at news orgs. NOT articles that merely mention Twitter/TikTok/social media, and NOT celebrity gossip.
  - science: scientific research, medicine, health, climate, environment, space, biology, animals
  Only label clearly relevant topics. Be conservative. Omit articles with no matching label.

"topics": array of up to 10 story threads, each covering 2+ articles about the SAME specific story. For each thread:
  - "summary": a concise 3–6 word label synthesizing the theme (NOT a headline — e.g. "Trump Iran Policy Shifts", NOT "A Timeline of Trump's Confusing Iran War Timetables"). Must be clearly distinct from other topic summaries.
  - "description": 1–2 sentence neutral summary of what this story is about, written for a reader who hasn't seen the articles yet.
  - "indices": array of article index numbers (integers) that belong to this thread

Only group articles that genuinely cover the same event or ongoing story. Do NOT group articles just because they share a common word like "home", "shooting", "says", etc.

Return ONLY valid JSON. Example:
{"labels":{"0":["culture"],"3":["politics","nyc"]},"topics":[{"summary":"Trump Iran War Plans","description":"The Trump administration has signaled shifting positions on potential military action against Iran, with conflicting statements from officials raising questions about U.S. policy.","indices":[3,7]}]}`,
    messages: [{ role: 'user', content: articleList }],
  });

  const response = await stream.finalMessage();
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) return null;

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const result = JSON.parse(jsonMatch[0]);

  // Validate and clean labels
  const labels = {};
  for (const [idx, topicList] of Object.entries(result.labels || {})) {
    const item = items[parseInt(idx)];
    if (item && Array.isArray(topicList) && topicList.length) {
      const valid = topicList.filter(t => VALID_TOPICS.has(t));
      if (valid.length) labels[item.link] = valid;
    }
  }

  // Validate topics: use indices to reliably map back to item links
  const topics = (result.topics || [])
    .filter(t => t.summary && Array.isArray(t.indices) && t.indices.length >= 2)
    .map(t => ({
      summary: t.summary,
      description: t.description || '',
      links: t.indices.map(i => items[parseInt(i)]?.link).filter(Boolean),
    }))
    .filter(t => t.links.length >= 2)
    .slice(0, 10);

  return { labels, topics };
}

// Local keyword/entity-based topic clustering (no API key needed)
const TICKER_STOP = new Set([
  'the','a','an','is','are','was','were','to','of','in','on','at','for',
  'with','as','by','from','that','this','it','he','she','they','we','you',
  'and','or','but','not','be','have','has','had','do','did','does','will',
  'would','could','should','may','might','its','their','our','his','her',
  'what','how','when','where','who','why','which','after','before','about',
  'more','new','says','said','over','up','out','than','so','if','can',
  'been','just','also','now','back','two','one','all','some','still',
  'here','amid','into','plan','year','time','week','month','day',
  'first','last','next','many','much','most','well','while','since',
  'between','against','other','another','very','like','make','take',
  'report','reports','could','even','long','show','no','yes','us','uk',
  'eu','un','mr','ms','dr','st','off','per','via','non','pro','anti',
  // colors — too generic as standalone entity topics
  'white','black','red','blue','green','gray','grey','brown','yellow',
  'orange','purple','pink','gold','silver',
  // generic nouns that look capitalized in titles but aren't specific entities
  'home','house','man','woman','men','women','people','person','family',
  'city','town','state','country','world','nation','government','court',
  'shooting','killed','dead','death','dies','died','shot','arrested',
  'accident','crash','attack','fire','flood','storm','crisis','threat',
  'silence','breaks','break','secret','truth','story','life','times',
  'says','told','calls','wants','needs','gets','puts','wins','loses',
  'news','report','deal','talks','vote','bill','law','rule','case',
  'top','best','worst','big','small','high','old','young','late',
  'inside','behind','amid','ahead','against','across','beyond',
]);

// Pick the most central headline from the group as the topic summary
function buildTopicSummary(term, idxs, items) {
  if (idxs.length === 1) {
    const t = items[idxs[0]].title;
    return t.length > 65 ? t.slice(0, 62) + '…' : t;
  }
  // Score each title by how many of its significant words appear in other titles in the group
  const getWords = title => new Set(
    title.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 3 && !TICKER_STOP.has(w))
  );
  const wordSets = idxs.map(i => getWords(items[i].title));
  const scores = idxs.map((_, pos) => {
    let score = 0;
    wordSets.forEach((ws, j) => {
      if (j !== pos) wordSets[pos].forEach(w => { if (ws.has(w)) score++; });
    });
    return score;
  });
  const best = idxs[scores.indexOf(Math.max(...scores))];
  const t = items[best].title;
  return t.length > 65 ? t.slice(0, 62) + '…' : t;
}

function buildTickerTopics(items) {
  const getTerms = title => {
    const terms = new Set();
    const words = title.split(/\s+/);
    // Named entities: capitalized words not at position 0, min 3 chars, not stop words
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (w.length < 3 || TICKER_STOP.has(w.toLowerCase())) continue;
      if (/^[A-Z]/.test(w)) {
        terms.add(w);
        // 2-word entity
        if (i + 1 < words.length) {
          const w2 = words[i + 1].replace(/[^a-zA-Z'-]/g, '');
          if (w2.length >= 3 && /^[A-Z]/.test(w2) && !TICKER_STOP.has(w2.toLowerCase())) {
            terms.add(`${w} ${w2}`);
          }
        }
      }
    }
    // Long lowercase keywords
    title.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
      .filter(w => w.length >= 5 && !TICKER_STOP.has(w))
      .forEach(w => terms.add(w));
    return terms;
  };

  // Build inverted index: term → [article indices]
  const index = {};
  items.forEach((item, i) => {
    getTerms(item.title).forEach(term => {
      (index[term] = index[term] || []).push(i);
    });
  });

  // Sort: multi-word entities first (more specific), then by article count
  const candidates = Object.entries(index)
    .filter(([, idxs]) => idxs.length >= 2)
    .sort(([a, ai], [b, bi]) => {
      const diff = b.split(' ').length - a.split(' ').length;
      return diff !== 0 ? diff : bi.length - ai.length;
    });

  const assigned = new Set();
  const topics = [];
  for (const [term, idxs] of candidates) {
    if (topics.length >= 10) break;
    const fresh = idxs.filter(i => !assigned.has(i));
    if (fresh.length < 2) continue;
    topics.push({
      summary: buildTopicSummary(term, idxs, items),
      links: idxs.map(i => items[i].link),
    });
    fresh.forEach(i => assigned.add(i));
  }
  return topics;
}

let tickerCache = null;
let tickerCacheTime = null;
const TICKER_TTL = 2 * 60 * 60 * 1000; // 2 hours

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
  tickerCache = null; // invalidate ticker so it re-groups with fresh articles

  res.json({ items, failed });
});

// Generate ticker topics and classify articles into filter labels in one Claude call
app.get('/api/ticker', async (req, res) => {
  if (tickerCache && Date.now() - tickerCacheTime < TICKER_TTL) {
    return res.json({ topics: tickerCache.topics, labels: tickerCache.labels, cached: true });
  }

  // If feed cache is empty (e.g. different function instance), populate it now
  if (!cache) {
    const feedSources = SOURCES.filter(s => s.feed);
    const allItems = [];
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
          snippet: (item.contentSnippet || item.summary || '').replace(/\s+/g, ' ').trim().slice(0, 800) || null,
          content: extractContent(item),
          image: extractImage(item),
        }));
      })
    );
    results.forEach(r => { if (r.status === 'fulfilled') allItems.push(...r.value); });
    cache = allItems.filter(i => i.title && i.link).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
    cacheTime = Date.now();
  }

  // Use most recent items from whatever's in the cache
  const items = cache.slice(0, 60);
  if (!items.length) return res.json({ topics: null, labels: {} });

  // Try one Claude call for both topic grouping+summaries and article classification
  let topics, labels;
  try {
    const result = await analyzeWithClaude(items);
    if (result) {
      topics = result.topics;
      labels = result.labels;
    }
  } catch (e) {
    console.warn('Claude analysis failed, falling back to keywords:', e.message);
  }

  // Fallbacks
  if (!topics) topics = buildTickerTopics(items);
  if (!labels) {
    labels = {};
    items.forEach(item => {
      const l = classifyLabels(item.title);
      if (l.length) labels[item.link] = l;
    });
  }

  tickerCache = { topics, labels };
  tickerCacheTime = Date.now();
  res.json({ topics, labels });
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

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`WTAF Feed running at http://localhost:${PORT}`));
}

module.exports = app;
