  const TOPICS = {
    tech:     { label: 'Tech',     keywords: [' ai ', 'a.i.', 'artificial intelligence', 'software', ' app ', 'apple', 'google', 'meta ', 'twitter', 'tiktok', 'algorithm', 'privacy', 'hack', 'cyber', 'startup', 'crypto', 'bitcoin', 'blockchain', 'openai', 'chatgpt', 'musk', 'silicon', 'internet', 'digital', 'social media', 'youtube', 'instagram', 'facebook', 'microsoft', 'amazon', 'surveillance', 'big tech', 'antitrust', 'tech ', 'technology', 'robot', 'automation', 'section 230', 'deepfake', 'sam altman', 'anthropic'] },
    politics: { label: 'Politics', keywords: ['trump', 'biden', 'congress', 'senate', 'democrat', 'republican', 'election', 'government', 'federal', 'administration', 'president', 'white house', 'supreme court', 'doj', 'fbi', 'cia', 'epstein', 'maga', 'gop', 'legislation', 'tariff', 'immigration', 'border', 'ukraine', 'russia', 'israel', 'gaza', 'nato', 'doge', 'cabinet', 'political', 'policy', 'vote', 'ballot'] },
    nyc:      { label: 'NYC',      keywords: ['new york', 'nyc', 'brooklyn', 'manhattan', 'bronx', 'queens', 'staten island', 'subway', 'mta', 'new york city', 'the city'] },
    culture:  { label: 'Culture',  keywords: ['film', 'movie', 'music', 'art ', 'book', 'novel', ' tv ', 'comedy', 'celebrity', 'fashion', ' style', 'nfl', 'nba', 'baseball', 'football', 'basketball', 'entertainment', 'hollywood', 'award', 'oscar', 'grammy', 'meme', 'viral', 'influencer', 'fandom', 'streaming show', 'podcast', 'album', 'concert tour', 'performance'] },
    media:    { label: 'Media',    keywords: ['newsletter', 'journalist', 'journalism', 'media ', 'newspaper', 'magazine', 'reporter', 'editorial', 'substack', 'cable news', 'msnbc', 'cnn', 'fox news', 'new york times', 'layoff', 'newsroom', 'publication', 'press', 'broadcast', 'anchor'] },
    science:  { label: 'Science',  keywords: ['science', 'research', 'study ', 'climate', 'environment', 'health', 'medicine', ' space ', 'nasa', 'biology', 'chemistry', 'physics', 'discovery', 'species', 'ocean', 'planet', 'nature', 'animal', 'disease', ' drug ', 'vaccine', 'gene', 'evolution'] },
  };

  const CAT_COLORS = {
    newsletter: 'var(--newsletter)',
    newsroom:   'var(--newsroom)',
    podcast:    'var(--podcast)',
    video:      'var(--video)',
    custom:     'var(--accent)',
  };

  const CAT_ORDER  = ['newsroom', 'newsletter', 'podcast', 'video', 'custom'];
  const CAT_LABELS = { newsroom: 'Newsrooms', newsletter: 'Newsletters', podcast: 'Podcasts', video: 'Video', custom: 'My Sources' };

  const EXCLUDE_KEYWORDS = [
    'sports', 'nfl', 'nba', 'mlb', 'nhl', 'soccer', 'football', 'basketball', 'baseball', 'hockey',
    'quarterback', 'touchdown', 'playoffs', 'super bowl', 'world series', 'olympics', 'athlete',
    'celebrity', 'celebrities', 'kardashian', 'kanye', 'taylor swift', 'beyoncé', 'grammys', 'oscars',
    'red carpet', 'hollywood', 'starring', 'box office', 'award show', 'emmy', 'golden globe',
  ];

  function getTopics(item) {
    const text = ((item.title || '') + ' ' + (item.snippet || '')).toLowerCase();
    return Object.keys(TOPICS).filter(key =>
      TOPICS[key].keywords.some(kw => text.includes(kw))
    );
  }

  function isExcluded(item) {
    const text = ((item.title || '') + ' ' + (item.snippet || '')).toLowerCase();
    return EXCLUDE_KEYWORDS.some(kw => text.includes(kw));
  }

  let allItems   = [];
  let allSources = [];
  let activeTopic  = 'all';
  let activeSource = '';
  let viewSaved  = false;
  let viewRead   = false;

  const HIDDEN_SOURCES_KEY = 'wtaf-hidden-sources';
  function getHiddenSourceNames() {
    try {
      const j = localStorage.getItem(HIDDEN_SOURCES_KEY);
      return j ? JSON.parse(j) : [];
    } catch { return []; }
  }
  function setHiddenSourceNames(arr) {
    localStorage.setItem(HIDDEN_SOURCES_KEY, JSON.stringify(arr));
  }

  const CUSTOM_SOURCES_KEY = 'wtaf-custom-sources';
  function getCustomSources() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_SOURCES_KEY) || '[]'); } catch { return []; }
  }
  function setCustomSources(arr) {
    localStorage.setItem(CUSTOM_SOURCES_KEY, JSON.stringify(arr));
  }

  const READ_ITEMS_KEY = 'wtaf-read-items';
  function getReadItems() {
    try { return new Set(JSON.parse(localStorage.getItem(READ_ITEMS_KEY) || '[]')); } catch { return new Set(); }
  }
  function markAsRead(url) {
    const read = getReadItems();
    read.add(url);
    localStorage.setItem(READ_ITEMS_KEY, JSON.stringify([...read]));
  }

  const HIDDEN_ITEMS_KEY = 'wtaf-hidden-items';
  function getHiddenItems() {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]')); } catch { return new Set(); }
  }
  function hideItem(url) {
    const h = getHiddenItems(); h.add(url);
    localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify([...h]));
  }

  const SAVED_ITEMS_KEY = 'wtaf-saved-items';
  function getSavedItems() {
    try { return JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || '[]'); } catch { return []; }
  }
  function isSaved(url) { return getSavedItems().some(s => s.link === url); }
  function toggleSaved(item) {
    const saved = getSavedItems();
    const idx = saved.findIndex(s => s.link === item.link);
    if (idx >= 0) saved.splice(idx, 1); else saved.unshift(item);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(saved));
    return idx < 0; // true = now saved
  }

  const TRASH_ICON    = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  const HIDE_ICON     = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const BOOKMARK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const BOOKMARK_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

  // ── Burger menu
  const menuBtn     = document.getElementById('menu-btn');
  const menuPanel   = document.getElementById('menu-panel');
  const menuOverlay = document.getElementById('menu-overlay');

  function openMenu()  { menuPanel.classList.add('open'); menuOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { menuPanel.classList.remove('open'); menuOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  menuBtn.addEventListener('click', openMenu);
  menuOverlay.addEventListener('click', closeMenu);
  document.getElementById('menu-close').addEventListener('click', closeMenu);

  // ── Theme
  const THEME_KEY = 'wtaf-theme';
  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
    const toggle = document.getElementById('theme-toggle');
    toggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(getTheme());
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // ── Add custom source
  document.getElementById('add-source-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input  = document.getElementById('add-source-input');
    const status = document.getElementById('add-source-status');
    const btn    = document.getElementById('add-source-btn');
    const feedUrl = input.value.trim();
    if (!feedUrl) return;

    const existing = getCustomSources();
    if (existing.some(s => s.feedUrl === feedUrl)) {
      status.className = 'error';
      status.textContent = 'This feed is already added.';
      return;
    }

    status.className = '';
    status.textContent = 'Loading…';
    btn.disabled = true;

    try {
      const res  = await fetch('/api/feed?url=' + encodeURIComponent(feedUrl));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load feed.');

      setCustomSources([...existing, { name: data.name, url: data.url, feedUrl, description: data.description }]);

      const hidden = getHiddenSourceNames();
      const newItems = (data.items || []).filter(item => !hidden.includes(item.source));
      allItems = [...allItems, ...newItems].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      });

      input.value = '';
      status.className = '';
      status.textContent = `Added "${data.name}"`;
      setTimeout(() => { if (status.textContent.startsWith('Added')) status.textContent = ''; }, 3000);
      buildSidebar();
      renderItems();
    } catch (err) {
      status.className = 'error';
      status.textContent = err.message || 'Could not load feed.';
    } finally {
      btn.disabled = false;
    }
  });

  // ── Sidebar + source select
  async function loadSources() {
    try {
      const res = await fetch('/api/sources');
      allSources = await res.json();
      buildSidebar();
    } catch (e) {
      console.error('Could not load sources', e);
    }
  }

  function buildSidebar() {
    const hidden = getHiddenSourceNames();
    const section = document.getElementById('sidebar-sources');

    const sourceRow = (name, desc, url, cat, feedUrl = null) => {
      const active = activeSource === name ? ' source-list-item-active' : '';
      const customAttr = feedUrl ? ` data-custom-feed-url="${escHtml(feedUrl)}"` : '';
      return `
        <li class="source-list-item${active}" data-source-name="${escHtml(name)}"${customAttr} role="button" tabindex="0">
          <span class="source-dot" style="background:${CAT_COLORS[cat]}"></span>
          <div>
            <div class="source-list-name"><a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(name)}</a></div>
            <div class="source-list-desc">${escHtml(desc)}</div>
          </div>
          <button type="button" class="source-remove" title="Remove source" aria-label="Remove source">${TRASH_ICON}</button>
        </li>
      `;
    };

    const customSources = getCustomSources().filter(s => s.feedUrl);
    const customSection = customSources.length ? `
      <div>
        <div class="sidebar-heading">My Sources</div>
        <ul class="source-list">
          ${customSources.map(s => sourceRow(s.name, s.description, s.url, 'custom', s.feedUrl)).join('')}
        </ul>
      </div>
    ` : '';

    const catSections = CAT_ORDER.filter(c => c !== 'custom').map(cat => {
      const sources = allSources.filter(s => s.category === cat && !hidden.includes(s.name));
      if (!sources.length) return '';
      return `
        <div>
          <div class="sidebar-heading">${CAT_LABELS[cat]}</div>
          <ul class="source-list">
            ${sources.map(s => sourceRow(s.name, s.description, s.url, cat)).join('')}
          </ul>
        </div>
      `;
    }).join('');

    const html = customSection + catSections;
    section.innerHTML = html;
    const menuSection = document.getElementById('menu-sidebar-sources');
    if (menuSection) menuSection.innerHTML = html;
  }

  function handleSourcesClick(e) {
    const removeBtn = e.target.closest('.source-remove');
    if (removeBtn) {
      e.preventDefault(); e.stopPropagation();
      const item = removeBtn.closest('.source-list-item');
      const name = item?.dataset.sourceName;
      const customFeedUrl = item?.dataset.customFeedUrl;
      if (name) {
        if (customFeedUrl) {
          setCustomSources(getCustomSources().filter(s => s.feedUrl !== customFeedUrl));
          allItems = allItems.filter(i => i.source !== name);
        } else {
          const list = getHiddenSourceNames();
          if (!list.includes(name)) setHiddenSourceNames([...list, name]);
          allItems = allItems.filter(i => i.source !== name);
        }
        if (activeSource === name) activeSource = '';
        buildSidebar(); renderItems();
      }
      return;
    }
    if (e.target.closest('.source-list-name a')) return;
    const item = e.target.closest('.source-list-item');
    if (item) { e.preventDefault(); const name = item.dataset.sourceName; if (name) { filterBySource(name); closeMenu(); } }
  }
  function handleSourcesKeydown(e) {
    if (e.target.closest('.source-remove')) return;
    const item = e.target.closest('.source-list-item');
    if (!item || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const name = item.dataset.sourceName;
    if (name) { filterBySource(name); closeMenu(); }
  }

  document.getElementById('sidebar-sources').addEventListener('click', handleSourcesClick);
  document.getElementById('sidebar-sources').addEventListener('keydown', handleSourcesKeydown);
  document.getElementById('menu-sidebar-sources').addEventListener('click', handleSourcesClick);
  document.getElementById('menu-sidebar-sources').addEventListener('keydown', handleSourcesKeydown);

  // Menu saved button delegates to desktop saved button
  document.getElementById('menu-saved-filter-btn').addEventListener('click', () => {
    document.getElementById('saved-filter-btn').click();
    closeMenu();
  });

  // Menu add-source form delegates to desktop form
  document.getElementById('menu-add-source-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const menuInput = document.getElementById('menu-add-source-input');
    document.getElementById('add-source-input').value = menuInput.value;
    menuInput.value = '';
    document.getElementById('add-source-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });

  // ── Fetch
  async function loadFeed(force = false) {
    if (force) {
      allItems = [];
      document.getElementById('items').innerHTML = '';
    }
    const loading = document.getElementById('loading');
    const errMsg  = document.getElementById('error-msg');

    loading.style.display = 'block';
    errMsg.style.display  = 'none';

    try {
      const url = force ? '/api/feeds?bust=' + Date.now() : '/api/feeds';
      const res  = await fetch(url);
      const data = await res.json();
      allItems   = data.items || [];

      const hidden = getHiddenSourceNames();
      allItems = allItems.filter(item => !hidden.includes(item.source));

      // Merge user-added custom sources
      const customSources = getCustomSources().filter(s => s.feedUrl);
      if (customSources.length) {
        const customResults = await Promise.allSettled(
          customSources.map(s => fetch('/api/feed?url=' + encodeURIComponent(s.feedUrl)).then(r => r.json()))
        );
        customResults.forEach(r => {
          if (r.status === 'fulfilled' && Array.isArray(r.value.items)) {
            allItems.push(...r.value.items.filter(item => !hidden.includes(item.source)));
          }
        });
        allItems.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });
      }

      const updatedText = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      document.getElementById('last-updated').textContent = updatedText;
      const menuUpdated = document.getElementById('menu-last-updated');
      if (menuUpdated) menuUpdated.textContent = updatedText;

      const existing = document.getElementById('failed-notice');
      if (existing) existing.remove();
      if (data.failed?.length) {
        const notice = document.createElement('div');
        notice.id = 'failed-notice';
        notice.textContent = 'Couldn\'t reach: ' + data.failed.join(', ');
        document.querySelector('main').before(notice);
      }

      renderItems();
      loadTicker();
    } catch (e) {
      errMsg.style.display = 'block';
      errMsg.textContent   = 'Failed to load feeds. Is the server running?';
    } finally {
      loading.style.display = 'none';
    }
  }

  // ── Ticker
  let tickerFilter = null;
  let articleLabels = {}; // link → [topic, …] — populated by Claude via /api/ticker

  async function loadTicker() {
    try {
      const res = await fetch('/api/ticker');
      if (!res.ok) return;
      const { topics, labels } = await res.json();
      if (labels) articleLabels = labels;
      if (!topics?.length) return;
      renderTicker(topics);
      renderMenuTicker(topics);
      renderItems(); // re-render now that labels are available
    } catch { /* ticker is decorative, fail silently */ }
  }

  function renderTicker(topics) {
    const bar   = document.getElementById('ticker-bar');
    const track = document.getElementById('ticker-track');
    track.innerHTML = '';

    function buildSet() {
      topics.forEach((t, i) => {
        if (i > 0) {
          const sep = document.createElement('span');
          sep.className = 'ticker-sep';
          sep.textContent = ' ◆ ';
          sep.setAttribute('aria-hidden', 'true');
          track.appendChild(sep);
        }
        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.textContent = t.summary;
        span.addEventListener('click', () => setTickerFilter(t));
        track.appendChild(span);
      });
      // trailing separator between the two copies
      const sep = document.createElement('span');
      sep.className = 'ticker-sep';
      sep.textContent = ' ◆ ';
      sep.setAttribute('aria-hidden', 'true');
      track.appendChild(sep);
    }

    // Build one set, then repeat topics until that set fills the viewport,
    // then add a second identical set for seamless looping.
    buildSet();
    bar.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const singleSetWidth = track.scrollWidth;
      // Repeat topics within each set until the set is wider than the viewport
      const repsPerSet = Math.max(1, Math.ceil((window.innerWidth + 1) / singleSetWidth));
      // Clear and rebuild with 2 sets, each containing repsPerSet repetitions
      track.innerHTML = '';
      for (let set = 0; set < 2; set++) {
        for (let r = 0; r < repsPerSet; r++) buildSet();
      }
      const oneSetWidth = repsPerSet * singleSetWidth;
      track.style.setProperty('--scroll-pct', '-50%');
      const tickerPxPerSec = 50;
      track.style.animationDuration = (oneSetWidth / tickerPxPerSec).toFixed(1) + 's';
    }));
  }

  function renderMenuTicker(topics) {
    const section = document.getElementById('menu-ticker-section');
    const list    = document.getElementById('menu-ticker-list');
    if (!topics?.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    list.innerHTML = '';
    topics.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'menu-ticker-btn ticker-item';
      btn.textContent = t.summary;
      btn.addEventListener('click', () => { setTickerFilter(t); closeMenu(); });
      list.appendChild(btn);
    });
  }

  function setTickerFilter(topic) {
    const isActive = tickerFilter?.summary === topic.summary;
    tickerFilter = isActive ? null : topic;
    console.log('[ticker] links:', tickerFilter?.links);
    console.log('[ticker] allItems links:', allItems.map(i => i.link));
    activeTopic = 'all';
    activeSource = '';
    viewRead = false;
    document.querySelectorAll('.filter-btn[data-topic]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ticker-item').forEach(el => {
      el.classList.toggle('ticker-active', !isActive && el.textContent === topic.summary);
    });
    buildSidebar();
    renderItems();
  }

  // ── Render
  function getItemTopics(item) {
    return articleLabels[item.link] || getTopics(item);
  }

  function renderItem(item) {
    const itemTopics = getItemTopics(item);
    const topicTags  = itemTopics.map(t =>
      `<span class="topic-tag topic-${t}" onclick="filterByTopic('${t}')" title="Filter to ${TOPICS[t].label}">${TOPICS[t].label}</span>`
    ).join('');

    const linkEsc = escHtml(item.link).replace(/"/g, '&quot;');
    return `
      <article class="feed-item" data-item-link="${linkEsc}">
        <div class="feed-item-link" role="button" tabindex="0" data-open-lightbox aria-label="Read article"></div>
        <div class="feed-item-inner">
          <div class="feed-item-text">
            <div class="item-meta">
              <span
                class="source-badge cat-${item.category}"
                onclick="filterBySource('${item.source.replace(/'/g, "\\'")}')"
                title="Filter to ${item.source}"
              >${item.source}</span>
              ${topicTags}
              ${item.date ? `<span class="item-date">${formatDate(item.date)}</span>` : ''}
              <span class="item-actions">
                <button class="item-action-btn${isSaved(item.link) ? ' item-saved' : ''}" data-action="save" title="Save for later" aria-label="Save for later">${isSaved(item.link) ? BOOKMARK_FILLED : BOOKMARK_ICON}</button>
                <button class="item-action-btn" data-action="hide" title="Dismiss" aria-label="Dismiss">${HIDE_ICON}</button>
              </span>
            </div>
            <div class="item-title">
              <span>${escHtml(item.title)}</span>
            </div>
            ${item.snippet ? `<div class="item-snippet">${escHtml(item.snippet)}</div>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  const MIN_FILTER_ITEMS = 3;

  function updateFilterVisibility() {
    if (viewSaved || viewRead) return;
    const hidden = getHiddenItems();
    const base = allItems.filter(item => {
      if (hidden.has(item.link)) return false;
      if (isExcluded(item)) return false;
      return true;
    });
    document.querySelectorAll('.filter-btn[data-topic]').forEach(btn => {
      const topic = btn.dataset.topic;
      if (topic === 'all') return;
      const count = base.filter(item => getItemTopics(item).includes(topic)).length;
      btn.style.display = count >= MIN_FILTER_ITEMS ? '' : 'none';
    });
  }

  function renderItems() {
    let filtered;
    if (viewRead) {
      const read = getReadItems();
      filtered = allItems.filter(item => read.has(item.link));
    } else if (viewSaved) {
      filtered = getSavedItems();
    } else {
      const hidden = getHiddenItems();
      const read = getReadItems();
      filtered = allItems.filter(item => {
        if (tickerFilter) {
          return tickerFilter.links?.includes(item.link) ?? false;
        }
        if (hidden.has(item.link)) return false;
        if (read.has(item.link)) return false;
        if (isExcluded(item)) return false;
        if (activeSource && item.source !== activeSource) return false;
        if (activeTopic !== 'all') {
          if (!getItemTopics(item).includes(activeTopic)) return false;
        }
        return true;
      });
    }

    updateFilterVisibility();

    const summaryEl = document.getElementById('ticker-summary');
    if (tickerFilter?.description) {
      summaryEl.innerHTML = tickerFilter.description;
      summaryEl.style.display = '';
    } else {
      summaryEl.style.display = 'none';
    }

    const countText = filtered.length
      ? `${filtered.length.toLocaleString()} item${filtered.length === 1 ? '' : 's'}` : '';
    document.getElementById('result-count').textContent = countText;
    const menuCount = document.getElementById('menu-result-count');
    if (menuCount) menuCount.textContent = countText;

    const container = document.getElementById('items');

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-msg">No items match your filters.</div>';
      return;
    }

    container.innerHTML = filtered.map(renderItem).join('');
  }

  // ── Filter handlers
  function filterBySource(name) {
    activeSource = activeSource === name ? '' : name;
    tickerFilter = null;
    viewRead = false;
    document.querySelectorAll('.ticker-item').forEach(el => el.classList.remove('ticker-active'));
    buildSidebar();
    renderItems();
  }

  function filterByTopic(topic) {
    viewSaved = false;
    viewRead = false;
    tickerFilter = null;
    document.querySelectorAll('.ticker-item').forEach(el => el.classList.remove('ticker-active'));
    document.getElementById('saved-filter-btn').classList.remove('active');
    document.querySelectorAll('.filter-btn[data-topic]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.filter-btn[data-topic="${topic}"]`).forEach(b => b.classList.add('active'));
    activeTopic = topic;
    renderItems();
  }

  document.querySelectorAll('.filter-btn[data-topic]').forEach(btn => {
    btn.addEventListener('click', () => {
      viewSaved = false;
      viewRead = false;
      tickerFilter = null;
      document.querySelectorAll('.ticker-item').forEach(el => el.classList.remove('ticker-active'));
      document.getElementById('saved-filter-btn').classList.remove('active');
      document.querySelectorAll('.filter-btn[data-topic]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.filter-btn[data-topic="${btn.dataset.topic}"]`).forEach(b => b.classList.add('active'));
      activeTopic = btn.dataset.topic;
      renderItems();
      closeMenu();
    });
  });

  // ── Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxIframe = document.getElementById('lightbox-iframe');
  const lightboxEmbedBlocked = document.getElementById('lightbox-embed-blocked');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');

  // Known blocked hosts — used as an instant fast-path so we skip the network check
  const KNOWN_BLOCKED = new Set(['dropsitenews.com', 'apod.nasa.gov', 'technologyreview.com', 'citationneeded.news', 'linkinbio.substack.com', 'usermag.co', 'deezlinks.com']);
  // Per-hostname cache: hostname → Promise<boolean> (true = can embed)
  const embedCache = new Map();
  const lightboxReaderViewBtn = document.getElementById('lightbox-reader-view-btn');
  let currentLightboxUrl  = '';
  let currentLightboxItem = null;

  function checkCanEmbed(url) {
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch (_) {}
    if (KNOWN_BLOCKED.has(host) || [...KNOWN_BLOCKED].some(b => host.endsWith('.' + b))) {
      return Promise.resolve(false);
    }
    if (!embedCache.has(host)) {
      embedCache.set(host,
        fetch('/api/can-embed?url=' + encodeURIComponent(url))
          .then(r => r.json())
          .then(d => d.canEmbed !== false)
          .catch(() => true)
      );
    }
    return embedCache.get(host);
  }

  function showReaderView(url) {
    lightboxReaderViewBtn.style.display = 'none';
    lightboxIframe.src = 'about:blank';
    lightboxIframe.style.display = 'none';
    lightboxEmbedBlocked.style.display = 'block';
    const readerLoading = document.getElementById('lightbox-reader-loading');
    const readerError   = document.getElementById('lightbox-reader-error');
    const readerContent = document.getElementById('lightbox-reader-content');
    readerLoading.style.display = 'block';
    readerError.style.display   = 'none';
    readerContent.style.display = 'none';
    readerContent.innerHTML     = '';
    fetch('/api/article?url=' + encodeURIComponent(url))
      .then(r => r.json())
      .then(data => {
        if (!data.content) throw new Error('no content');
        readerContent.innerHTML     = data.content;
        readerLoading.style.display = 'none';
        readerContent.style.display = 'block';
      })
      .catch(() => {
        readerLoading.style.display = 'none';
        readerError.style.display   = 'block';
      });
  }

  function updateLightboxSaveBtn() {
    const btn = document.getElementById('lightbox-save-btn');
    const saved = currentLightboxItem && isSaved(currentLightboxItem.link);
    btn.textContent = saved ? 'Saved ✓' : 'Save for later';
    btn.style.color = saved ? 'var(--accent)' : '';
  }

  async function openLightbox(url) {
    currentLightboxUrl  = url;
    currentLightboxItem = allItems.find(i => i.link === url) || getSavedItems().find(i => i.link === url) || null;
    markAsRead(url);
    renderItems();
    updateLightboxSaveBtn();
    document.getElementById('lightbox-open-tab').href = url;
    document.getElementById('lightbox-open-tab-fallback').href = url;

    // Show loading state immediately while the embed check runs
    lightboxReaderViewBtn.style.display = 'none';
    lightboxIframe.src = 'about:blank';
    lightboxIframe.style.display = 'none';
    lightboxEmbedBlocked.style.display = 'block';
    document.getElementById('lightbox-reader-loading').style.display = 'block';
    document.getElementById('lightbox-reader-error').style.display   = 'none';
    document.getElementById('lightbox-reader-content').style.display = 'none';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const canEmbed = await checkCanEmbed(url);
    if (canEmbed) {
      lightboxEmbedBlocked.style.display = 'none';
      lightboxIframe.style.display       = 'block';
      lightboxIframe.src                 = url;
      lightboxReaderViewBtn.style.display = 'inline';
    } else {
      showReaderView(url);
    }
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxIframe.src = '';
    lightboxIframe.style.display = 'block';
    lightboxEmbedBlocked.style.display = 'none';
    lightboxReaderViewBtn.style.display = 'none';
    document.getElementById('lightbox-reader-content').innerHTML = '';
    document.body.style.overflow = '';
    currentLightboxUrl = '';
  }

  lightboxReaderViewBtn.addEventListener('click', () => showReaderView(currentLightboxUrl));

  document.getElementById('items').addEventListener('click', (e) => {
    if (e.target.closest('.item-action-btn, .source-badge, .topic-tag')) return;
    const article = e.target.closest('.feed-item[data-item-link]');
    if (!article) return;
    e.preventDefault();
    openLightbox(article.dataset.itemLink);
  });

  document.getElementById('items').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.feed-item-link[data-open-lightbox]');
    if (!trigger) return;
    e.preventDefault();
    const article = trigger.closest('.feed-item');
    const url = article?.dataset.itemLink;
    if (url) openLightbox(url);
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  // ── Item action buttons (save / hide)
  document.getElementById('items').addEventListener('click', (e) => {
    const btn = e.target.closest('.item-action-btn[data-action]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const article = btn.closest('.feed-item');
    const url = article?.dataset.itemLink;
    if (!url) return;

    if (btn.dataset.action === 'hide') {
      hideItem(url);
      allItems = allItems.filter(i => i.link !== url);
      renderItems();
    } else if (btn.dataset.action === 'save') {
      const item = allItems.find(i => i.link === url) || getSavedItems().find(i => i.link === url);
      if (!item) return;
      const nowSaved = toggleSaved(item);
      btn.innerHTML = nowSaved ? BOOKMARK_FILLED : BOOKMARK_ICON;
      btn.classList.toggle('item-saved', nowSaved);
      if (viewSaved && !nowSaved) renderItems(); // remove from saved view if un-saved
    }
  });

  // ── Lightbox save button
  document.getElementById('lightbox-save-btn').addEventListener('click', () => {
    if (!currentLightboxItem) return;
    toggleSaved(currentLightboxItem);
    updateLightboxSaveBtn();
    // refresh any visible saved/unsaved state in the list
    renderItems();
  });

  // ── Saved filter button
  const savedFilterBtn = document.getElementById('saved-filter-btn');
  savedFilterBtn.addEventListener('click', () => {
    viewSaved = !viewSaved;
    viewRead = false;
    document.getElementById('read-filter-btn').classList.remove('active');
    document.getElementById('menu-read-filter-btn').classList.remove('active');
    savedFilterBtn.classList.toggle('active', viewSaved);
    if (viewSaved) {
      // deactivate topic filters while in saved view
      document.querySelectorAll('.filter-btn[data-topic]').forEach(b => b.classList.remove('active'));
    } else {
      const activeTopicBtn = document.querySelector(`.filter-btn[data-topic="${activeTopic}"]`);
      if (activeTopicBtn) activeTopicBtn.classList.add('active');
    }
    renderItems();
    closeMenu();
  });

  // ── Read filter button
  const readFilterBtn = document.getElementById('read-filter-btn');
  readFilterBtn.addEventListener('click', () => {
    viewRead = !viewRead;
    viewSaved = false;
    savedFilterBtn.classList.remove('active');
    document.getElementById('menu-saved-filter-btn').classList.remove('active');
    readFilterBtn.classList.toggle('active', viewRead);
    document.getElementById('menu-read-filter-btn').classList.toggle('active', viewRead);
    if (!viewRead) {
      const activeTopicBtn = document.querySelector(`.filter-btn[data-topic="${activeTopic}"]`);
      if (activeTopicBtn) activeTopicBtn.classList.add('active');
    } else {
      document.querySelectorAll('.filter-btn[data-topic]').forEach(b => b.classList.remove('active'));
    }
    renderItems();
    closeMenu();
  });
  document.getElementById('menu-read-filter-btn').addEventListener('click', () => {
    readFilterBtn.click();
  });

  // ── Helpers
  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diff  = Date.now() - d;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  <  1) return 'just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init
  loadSources();
  loadFeed();
