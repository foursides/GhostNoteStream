/*!
 * Ghost ActivityPub Notes Integration (Universal)
 * Version: 1.0.0
 * License: MIT
 *
 * Features
 * - Fetches ActivityPub Notes from Ghost's .ghost/activitypub outbox
 * - Paginates if needed to reach the desired limit
 * - Extracts image URLs from object.attachment/image/icon
 * - Sanitizes injected HTML (light, client-side)
 * - Merges Notes with existing posts by published date
 * - Configurable selectors/locale/format
 *
 * Usage
 * 1) Save as: assets/js/notes-integration.js (inside your active theme)
 * 2) Include ON THE HOMEPAGE TEMPLATE (e.g., index.hbs):
 *    <script defer src="{{asset "js/notes-integration.js"}}"></script>
 */

(function (global) {
  'use strict';

  // ------------------------------
  // Configuration (tweak here)
  // ------------------------------
  const CONFIG = {
    // How many notes to display
    notesLimit: 10,

    // Max paginated pages to fetch from the outbox to reach notesLimit
    maxOutboxPages: 3,

    // Where to render: container that wraps your existing posts feed
    // Provide one or more selectors; first match wins.
    feedContainerSelectors: [
      '.archive-posts',
      '#post-feed.archive-posts',
      '#post-feed',
      '.post-feed' // fallback for generic themes
    ],

    // Existing post selector (these are extracted & merged with Notes)
    postItemSelector: '.archive-post',

    // How to detect homepage (Ease/Ease-derivatives use home-template)
    // If set to null, script always runs.
    requireBodyClass: 'home-template',

    // Date rendering
    dateLocale: (navigator.language || 'en-US'),
    dateFormat: { year: 'numeric', month: 'long', day: 'numeric' },

    // Markup for Note items (classes chosen to be theme-friendly)
    classes: {
      noteArticle: 'archive-post tag-micro tag-note post no-image single-content gh-content kg-canvas',
      excerpt: 'archive-post-excerpt',
      date: 'archive-post-date',
      tagsWrap: 'archive-post-tags',
      noteBadge: 'note-badge',
      imageFigure: 'kg-card kg-image-card',
      image: 'kg-image',
      attachmentsWrap: 'note-attachments'
    }
  };

  // ------------------------------
  // Utilities
  // ------------------------------
  const asArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);

  const toAbsolute = (urlStr) => {
    try { return new URL(urlStr, global.location.origin).href; }
    catch { return urlStr; }
  };

  const dedupe = (arr) => [...new Set(arr)];

  const formatDate = (date, locale, opts) =>
    new Intl.DateTimeFormat(locale, opts).format(date);

  const el = (tag, cls) => {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };

  // Light DOM sanitization for injected HTML fragments
  const sanitizeFragment = (frag) => {
    frag.querySelectorAll('script').forEach(n => n.remove());
    frag.querySelectorAll('*').forEach(node => {
      // Strip inline event handlers (on*)
      for (const attr of [...node.attributes]) {
        if (attr.name.toLowerCase().startsWith('on')) node.removeAttribute(attr.name);
      }
    });
    return frag;
  };

  // ------------------------------
  // ActivityPub helpers
  // ------------------------------
  function extractImageUrlsFromObject(obj) {
    const urls = [];

    // Primary: attachments (ActivityStreams Image/Link)
    asArray(obj.attachment).forEach(att => {
      if (!att) return;
      if (att.type === 'Image' && att.url) urls.push(att.url);
      else if (att.url) urls.push(att.url);
      else if (att.href) urls.push(att.href);
    });

    // Fallbacks:
    if (obj.image) {
      if (typeof obj.image === 'string') urls.push(obj.image);
      else if (obj.image.url) urls.push(obj.image.url);
      else if (obj.image.href) urls.push(obj.image.href);
    }
    if (obj.icon) {
      if (typeof obj.icon === 'string') urls.push(obj.icon);
      else if (obj.icon.url) urls.push(obj.icon.url);
      else if (obj.icon.href) urls.push(obj.icon.href);
    }

    return dedupe(urls.map(toAbsolute));
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { headers: { accept: 'application/activity+json' } });
    if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
    return res.json();
  }

  async function fetchProfile(origin) {
    return fetchJSON(`${origin}/.ghost/activitypub/users/index`).catch(() => ({}));
  }

  // Fetch first page URL from outbox index
  async function fetchOutboxFirst(origin) {
    const outbox = await fetchJSON(`${origin}/.ghost/activitypub/outbox/index`);
    if (!outbox || !outbox.first) throw new Error('Invalid outbox: missing "first"');
    return outbox.first;
  }

  // Robustly collect up to `limit` Notes across paginated outbox pages
  async function fetchNotesPaginated(limit, maxPages) {
    const origin = global.location.origin;
    const profile = await fetchProfile(origin);
    const firstPageUrl = await fetchOutboxFirst(origin);

    let pageUrl = firstPageUrl;
    let pageCount = 0;
    const notes = [];

    while (pageUrl && pageCount < maxPages && notes.length < limit) {
      const page = await fetchJSON(pageUrl);
      const items = asArray(page.orderedItems);

      for (const item of items) {
        if (item?.type === 'Create' && item.object?.type === 'Note') {
          const obj = item.object;
          notes.push({
            type: 'note',
            id: obj.id,
            content: obj.content || '',
            published: new Date(obj.published),
            publishedISO: obj.published,
            attachments: extractImageUrlsFromObject(obj),
            author: {
              name: profile?.name || '',
              username: profile?.preferredUsername || '',
              icon: profile?.icon?.url || ''
            }
          });
          if (notes.length >= limit) break;
        }
      }

      // Basic pagination: follow "next" if available (ActivityPub page spec)
      pageUrl = page.next || null;
      pageCount += 1;
    }

    return notes.slice(0, limit);
  }

  // ------------------------------
  // DOM extraction & rendering
  // ------------------------------
  function findFeedContainer() {
    const doc = global.document;
    for (const sel of CONFIG.feedContainerSelectors) {
      const node = doc.querySelector(sel);
      if (node) return node;
    }
    return null;
  }

  function extractPostsFromDOM() {
    const posts = [];
    const nodeList = global.document.querySelectorAll(CONFIG.postItemSelector);
    nodeList.forEach(postEl => {
      const timeEl = postEl.querySelector('time[datetime]');
      if (!timeEl) return;
      const iso = timeEl.getAttribute('datetime');
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        posts.push({
          type: 'post',
          element: postEl.cloneNode(true),
          published: d,
          publishedISO: iso
        });
      }
    });
    return posts;
  }

  function createNoteElement(note) {
    const article = el('article', CONFIG.classes.noteArticle);
    const dateHTML = formatDate(note.published, CONFIG.dateLocale, CONFIG.dateFormat);

    // Skeleton
    article.innerHTML = [
      '<div class="archive-post-content">',
        `<time class="${CONFIG.classes.date}" datetime="${note.publishedISO}">${dateHTML}</time>`,
        `<div class="${CONFIG.classes.excerpt}"></div>`,
        `<span class="${CONFIG.classes.tagsWrap}"><span class="${CONFIG.classes.noteBadge}">Note</span></span>`,
      '</div>'
    ].join('');

    const excerptEl = article.querySelector(`.${CONFIG.classes.excerpt}`);

    // Inject Note content
    const tpl = el('template');
    tpl.innerHTML = note.content || '';
    const frag = sanitizeFragment(tpl.content);
    excerptEl.appendChild(frag);

    // Attachments (images)
    if (Array.isArray(note.attachments) && note.attachments.length) {
      const wrap = el('div', CONFIG.classes.attachmentsWrap);
      for (const src of note.attachments) {
        const fig = el('figure', CONFIG.classes.imageFigure);
        const img = el('img', CONFIG.classes.image);
        img.src = src;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.referrerPolicy = 'no-referrer';
        fig.appendChild(img);
        wrap.appendChild(fig);
      }
      excerptEl.appendChild(wrap);
    }

    return article;
  }

  function mergeAndSort(posts, notes) {
    const combined = posts.concat(notes);
    combined.sort((a, b) => b.published - a.published);
    return combined;
  }

  function renderCombinedFeed(items, container) {
    const frag = global.document.createDocumentFragment();
    for (const item of items) {
      if (item.type === 'post') {
        frag.appendChild(item.element);
      } else if (item.type === 'note') {
        frag.appendChild(createNoteElement(item));
      }
    }
    container.innerHTML = '';
    container.appendChild(frag);
  }

  // ------------------------------
  // Main
  // ------------------------------
  async function run() {
    try {
      if (CONFIG.requireBodyClass) {
        const has = global.document.body.classList.contains(CONFIG.requireBodyClass);
        if (!has) return; // not the homepage (or desired route)
      }

      const container = findFeedContainer();
      if (!container) return;

      const posts = extractPostsFromDOM(); // may be empty
      const notes = await fetchNotesPaginated(CONFIG.notesLimit, CONFIG.maxOutboxPages);

      if (!posts.length && !notes.length) return;

      const combined = mergeAndSort(posts, notes);
      renderCombinedFeed(combined, container);
    } catch (err) {
      // Never break the page
      console.error('[Ghost Notes] Integration failed:', err);
    }
  }

  // Expose a minimal API for manual re-run/debugging
  global.GhostNotes = {
    run,
    config: CONFIG
  };

  // Auto-run on DOM ready
  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})(window);
