const express = require('express');
const Parser = require('rss-parser');
const path = require('path');

const app = express();
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'WTAF-Feed/1.0 (RSS Aggregator)' },
});

app.use(express.static(path.join(__dirname, 'public')));

const SOURCES = [
  {
    name: 'Today In Tabs',
    url: 'https://www.todayintabs.com',
    feed: 'https://www.todayintabs.com/feed',
    description: "Rusty Foster's unmissable daily link roundup",
    category: 'newsletter',
  },
  {
    name: 'Platformer',
    url: 'https://www.platformer.news',
    feed: 'https://www.platformer.news/feed',
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
    name: 'Status',
    url: 'https://www.semafor.com/newsletters/status',
    feed: 'https://www.semafor.com/rss/status.xml',
    description: "Oliver Darcy's unmissable media reporting",
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
    name: 'Search Engine',
    url: 'https://searchengine.show',
    feed: 'https://feeds.simplecast.com/y1FkiSrY',
    description: "PJ Vogt's super fun podcast",
    category: 'podcast',
  },
  {
    name: 'Read Max',
    url: 'https://www.readmax.online',
    feed: 'https://www.readmax.online/feed',
    description: 'Max Read on media and the internet',
    category: 'newsletter',
  },
  {
    name: 'Never Post',
    url: 'https://neverpo.st',
    feed: 'https://feeds.acast.com/public/shows/never-post',
    description: 'Podcast specializing in all things extremely online',
    category: 'podcast',
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
    name: 'Howtown',
    url: 'https://www.howtown.com',
    feed: 'https://www.howtown.com/feed/',
    description: 'Delightful science journalism from former Vox and NPR journalists',
    category: 'newsletter',
  },
  {
    name: 'The Handbasket',
    url: 'https://thehandbasket.substack.com',
    feed: 'https://thehandbasket.substack.com/feed',
    description: "Marisa Kabas on Trump administration skullduggery",
    category: 'newsletter',
  },
  {
    name: '65,000',
    url: 'https://65000.substack.com',
    feed: 'https://65000.substack.com/feed',
    description: 'Niche online creative communities',
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
    name: 'Cool Zone Media',
    url: 'https://coolzonemedia.com',
    feed: 'https://feeds.megaphone.fm/behindthebastards',
    description: "Robert Evans' podcast network",
    category: 'podcast',
  },
  {
    name: 'Some More News',
    url: 'https://www.somemorenews.com',
    feed: 'https://www.somemorenews.com/feed/',
    description: "Cody Johnston's funny and insightful news teardowns",
    category: 'podcast',
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
    url: 'https://www.thepresentage.com',
    feed: 'https://www.thepresentage.com/feed',
    description: 'Parker Molloy on news and politics',
    category: 'newsletter',
  },
  {
    name: 'Spitfire News',
    url: 'https://spitfirenews.substack.com',
    feed: 'https://spitfirenews.substack.com/feed',
    description: "Kat Tenbarge's post-Me Too era coverage",
    category: 'newsletter',
  },
  {
    name: 'Local News International',
    url: 'https://localnewsinternational.substack.com',
    feed: 'https://localnewsinternational.substack.com/feed',
    description: "Dave Jorgenson's newsletter and video series",
    category: 'newsletter',
  },
  {
    name: 'Dropout',
    url: 'https://www.dropout.tv',
    feed: null,
    description: 'Subscriber comedy streaming from former CollegeHumor alums',
    category: 'video',
  },
  {
    name: 'Nebula',
    url: 'https://nebula.tv',
    feed: null,
    description: 'YouTuber platform expanding into original titles',
    category: 'video',
  },
  {
    name: 'The Cut',
    url: 'https://www.thecut.com',
    feed: 'https://www.thecut.com/feeds/flipboard.rss',
    description: "New York Magazine's essential women's interest and culture vertical",
    category: 'newsroom',
  },
];

let cache = null;
let cacheTime = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

app.get('/api/sources', (req, res) => {
  res.json(SOURCES.map(({ name, url, description, category, feed }) => ({
    name,
    url,
    description,
    category,
    hasRss: !!feed,
  })));
});

app.get('/api/feeds', async (req, res) => {
  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.json({ items: cache, cached: true, cachedAt: new Date(cacheTime).toISOString() });
  }

  const feedSources = SOURCES.filter(s => s.feed);

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
          .slice(0, 450) || null,
      }));
    })
  );

  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(item => item.title && item.link)
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

  const failed = results
    .map((r, i) => r.status === 'rejected' ? feedSources[i].name : null)
    .filter(Boolean);

  cache = items;
  cacheTime = Date.now();

  res.json({ items, cached: false, failed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WTAF Feed running at http://localhost:${PORT}`));
