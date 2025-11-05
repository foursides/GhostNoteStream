# 🕊️ GhostNoteStream

**Merge your ActivityPub Notes directly into your Ghost homepage feed.**  
Theme-aware, privacy-first, and zero external dependencies.

---

## 📋 Prerequisites

Before you begin:

- Ghost **v6.0** or higher  
- **ActivityPub integration** enabled in Ghost Admin (`Settings → Labs`)  
- A theme with a visible homepage post feed  
- Basic familiarity with editing Ghost theme files  

---

## ✨ Overview

**GhostNoteStream** dynamically merges your **ActivityPub Notes** (micro-posts) into your Ghost homepage feed, ordering them chronologically with your long-form posts.

It works entirely **within your Ghost instance** — no third-party scripts or APIs — and automatically matches your theme's structure and accent color.

---

## 🧠 Inspiration

Based on and inspired by [synapsmedia/ghost-activitypub-embed](https://github.com/synapsmedia/ghost-activitypub-embed) by **Synaps Media**, which introduced an elegant approach to embedding ActivityPub content in Ghost.

GhostNoteStream takes it further: it merges Notes *directly* into your feed for a native, seamless look.

---

## 👤 Author

**James McCullough**  
📍 [foursides.ca](https://foursides.ca)  
📧 [james@foursides.pro](mailto:james@foursides.pro)

---

## 🛠️ Features

- ✅ **Zero external dependencies** — pure JavaScript using Ghost's built-in ActivityPub API  
- 🔒 **Privacy-first** — no external calls; runs entirely in your Ghost theme  
- ⚡ **Performance-optimized** — lazy loads images and efficiently merges content  
- 🧩 **Theme-aware** — compatible with Casper, Edition, Ease, and Dawn  
- 🎨 **Accent-color ready** — automatically inherits `--ghost-accent-color`  
- 📸 **Attachment and image rendering**  
- 📱 **Responsive layout** using CSS variables  
- 🪶 **Lightweight** (~5 KB minified)

---

## 📂 File Structure

Add these files to your active Ghost theme:

```
assets/
├── js/
│   └── notes-integration.js    # Core integration script
└── css/
    └── optional.css            # Optional styling for Notes
```

---

## 🚀 Installation

### Method 1 – Theme Integration (Recommended)

1. **Upload files**  
   - `/assets/js/notes-integration.js`  
   - `/assets/css/optional.css` (optional)

2. **Edit your homepage template (`index.hbs`)**  
   Add near the bottom, before `</body>`:
   
   ```handlebars
   {{!-- GhostNoteStream --}}
   <script defer src="{{asset "js/notes-integration.js"}}"></script>
   <link rel="stylesheet" href="{{asset "css/optional.css"}}">
   ```

3. **Upload or restart your theme** from Ghost Admin.

### Method 2 – Code Injection (Quick Setup)

1. Go to **Settings → Code Injection**

2. In the **Site Footer** field, add:

   ```html
   <script src="/assets/js/notes-integration.js"></script>
   ```

3. **Save changes** and refresh your homepage.

---

## ⚙️ Configuration

GhostNoteStream can be customized by editing the small config block at the top of `notes-integration.js`.

### Basic Configuration

```javascript
const NOTE_SELECTORS = {
  containerClass: 'archive-post',
  dateClass: 'archive-post-date',
  contentClass: 'archive-post-excerpt',
  tagsClass: 'archive-post-tags'
};
```

Change these class names if your theme uses a different structure.

### Example for Casper

```javascript
containerClass: 'post-card',
contentClass: 'post-card-excerpt'
```

---

## 🔧 Troubleshooting

### Notes not appearing

- Confirm **ActivityPub is enabled** (`Settings → Labs → ActivityPub`)
- Verify you've **published at least one Note**
- Check the **browser console** for fetch or CORS errors
- **Restart Ghost** after adding or updating theme files

### Styling issues

- Make sure you've added `optional.css`
- If accent colors don't apply, define `--ghost-accent-color` in your theme's `:root`

### Console error: `Unexpected token '<'`

- The JS path is incorrect or not accessible
- → Double-check your file structure under `/assets/js/`

---

## 📖 Examples

### Default Setup

```javascript
GhostNoteStream.init({
  container: '.post-feed'
});
```

### Custom Colors & Order

```javascript
GhostNoteStream.init({
  container: '.post-feed',
  accentColor: '#1479A5',
  maxNotes: 8,
  sortOrder: 'notes-first'
});
```

---

## 🌐 Browser Compatibility

| Browser       | Minimum Version |
|---------------|-----------------|
| Chrome / Edge | 90+             |
| Firefox       | 88+             |
| Safari        | 14+             |
| Opera         | 76+             |

*Uses native `fetch()` and modern ES6+ syntax.*

---

## 🎨 Optional CSS

The included `/assets/css/optional.css` adds:

- Subtle accent gradient for `.tag-note`
- Accent-colored badge
- Responsive images and soft fade-in animation

It's fully optional — you can skip it if your theme already styles Notes.

---

## 🖼️ Screenshots

You can include before/after screenshots or a short clip in your repo:

```
/docs/screenshot-light.png
/docs/screenshot-dark.png
```

Then add:

```markdown
![GhostNoteStream – Light Theme](docs/screenshot-light.png)
![GhostNoteStream – Dark Theme](docs/screenshot-dark.png)
```

---

## 💡 FAQ

**Q: Does this require a Ghost Content API key?**  
A: No — it uses Ghost's built-in ActivityPub endpoints.

**Q: How are Notes detected?**  
A: They're fetched from `/.ghost/activitypub/outbox/index` and filtered by `type: Note`.

**Q: Do I need extra configuration in Ghost Admin?**  
A: Only to enable ActivityPub (`Settings → Labs`).

**Q: What about infinite scrolling or AJAX pagination?**  
A: Currently, GhostNoteStream loads once per page. For infinite scroll, re-run `integrateNotesIntoFeed()` after new content loads.

**Q: Can I see it live?**  
A: [foursides.ca](https://foursides.ca) demonstrates the integration in production.

---

## 📜 License

**MIT License** © 2025 James McCullough

Based on and inspired by [synapsmedia/ghost-activitypub-embed](https://github.com/synapsmedia/ghost-activitypub-embed)

---

## ☕ Support the Project

If GhostNoteStream helped your site, you can support future development:

💳 **PayPal:** [paypal.me/JamesMcCullough633](https://paypal.me/JamesMcCullough633)  
☕ **Tip Jar:** [foursides.ca/#/portal/support](https://foursides.ca/#/portal/support)
