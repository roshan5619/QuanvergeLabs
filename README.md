# Quanverge Labs — static website

The public marketing site, built with plain HTML, CSS and JavaScript.
No build step, no framework, no `npm install`. Open the file and it works.

```
quanverge-site/
├── index.html          home page
├── products.html       lists the four products
├── reqagnize.html      \
├── q-vis.html           |  one page per product
├── sanqya.html          |  (detail, benchmarks, ROI calculator)
├── qreate.html         /
├── team.html
├── research.html
├── roadmap.html
├── contact.html
├── css/styles.css      all the styling, shared by every page
├── js/main.js          menu, ROI calculators, scroll fade-in
├── images/             the Quanverge logo (the only image on the site)
└── README.md           this file
```

Every page is self-contained: open it, edit it, save it. They all share the
one stylesheet and the one script.

## Viewing it

Double-click `index.html`. That's it — it opens in your browser.

Everything works this way except nothing, really — there's no server needed.
If you later want a local address instead of a `file:///` one, run this in
this folder and open <http://localhost:8000>:

```
python -m http.server 8000
```

## Editing it

Open the page you want to change and type over the text. Save, refresh the
browser. That's the whole workflow.

| I want to change... | Open this file |
|---|---|
| Headline, the five stat numbers, the problem cards | `index.html` |
| The product list and its summary blurbs | `products.html` |
| A product's description, use cases, table or calculator | that product's page, e.g. `q-vis.html` |
| Names, roles, bios, LinkedIn links | `team.html` |
| Publications (currently a placeholder) | `research.html` |
| The three roadmap phases | `roadmap.html` |
| Address and email | `contact.html` |

### The navigation bar and footer

These are repeated at the top and bottom of every page. That's the trade-off
of a plain-HTML site: there is no way to write them once and share them
without a build step or JavaScript.

**So if you add a menu item or change the footer, make the same edit in all
ten `.html` files.** The blocks are identical apart from one thing: on each
page, the link for that page carries `class="is-current"`, which is what
highlights it in teal.

### Adding a team member's LinkedIn

In `team.html`, find their card and replace the `#`:

```html
<a href="https://www.linkedin.com/in/their-profile" target="_blank" rel="noopener noreferrer">
```

### Changing the colours

Open `css/styles.css`. The first block (section 1) defines every colour used
on the site. Change a value there and it updates everywhere:

```css
--bg:     #ffffff;   /* page background */
--text:   #0b2530;   /* body text */
--brand:  #14708a;   /* main teal — links, accents */
--accent: #9a6410;   /* secondary accent — ROI figures */
```

**One thing to watch if you change these.** Text needs to be dark enough to
read against the white background — the accepted minimum is a contrast ratio
of 4.5:1. The logo's bright cyan (`#2fc6d6`) only reaches 2.1:1, which is why
it is kept as `--brand-fill` and used *behind* white text in buttons, never as
text on white. Each colour in the file has its ratio noted in a comment. If you
pick a new colour, check it at <https://webaim.org/resources/contrastchecker/>.

### Changing the ROI calculator maths

You don't need to touch JavaScript. Each result reads its settings from
attributes in the HTML:

```html
<span data-roi-output
      data-roi-source="req-images"   <!-- which slider it reads   -->
      data-roi-op="divide"           <!-- divide | multiply | errorDrop -->
      data-roi-by="100">             <!-- the number to apply    -->
</span>
```

To change "100x fewer images" to "50x", change `data-roi-by` to `50` and
update the wording in the `roi-cite` line underneath.

Slider ranges live on the `<input>` itself (`min`, `max`, `step`, `value`).

`errorDrop` is used for accuracy figures. "30% better" means 30% of the
remaining mistakes are removed, not 30 percentage points added — so an
80%-accurate model becomes 86%, and the result can never exceed 100%.

### Adding a new page

1. Copy the closest existing page (say `roadmap.html`) to a new filename.
2. Change the `<title>`, the `<meta name="description">`, and the content.
3. Move `class="is-current"` onto your new page's own link.
4. Add the link to the navigation bar **in all the other pages too**:

```html
<li><a href="your-new-page.html">Your Page</a></li>
```

## The face-login app

The face-recognition login is a separate React application (in
`../quanverge-web`). It is **not live yet**, so the site shows it as coming
soon in two places — the navbar and the closing call-to-action:

```html
<span class="navbar-cta is-soon">Sign In &middot; Coming Soon</span>
```

Both are `<span>` elements rather than links, so there is nothing to click and
no broken URL. When the app launches, turn them back into links:

```html
<a href="/app/" class="navbar-cta">Sign In</a>
```

...and upload the React build into an `app` folder beside this site.

## Publishing changes

This folder **is** the GitHub repository
(<https://github.com/roshan5619/QuanvergeLabs>), and the live site at
<https://www.quanvergelabs.com> is served from it by GitHub Pages.

To publish an edit:

```
git add -A
git commit -m "Describe what you changed"
git push
```

The site updates about a minute later. There is nothing to build or upload —
what's in this folder is exactly what goes on the web, and each page gets its
own address:

| File | Address |
|---|---|
| `index.html` | `www.quanvergelabs.com` |
| `products.html` | `www.quanvergelabs.com/products.html` |
| `q-vis.html` | `www.quanvergelabs.com/q-vis.html` |

`index.html` is special — it's what a web server shows when someone visits the
domain with no page name. Keep that filename as it is.

The address with `www.` is the canonical one. GitHub redirects the bare
`quanvergelabs.com` to it automatically, provided the DNS records below stay
in place.

### DNS records this site depends on

Set at the domain registrar (Hostinger), under DNS / Nameservers:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `roshan5619.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

The `A` records are what make the bare domain redirect to `www`. The four
addresses are GitHub's — they are the same for everyone using Pages.

### Two files that keep the hosting working

- **`CNAME`** contains `www.quanvergelabs.com`. It tells GitHub Pages which domain
  to serve. Deleting or misspelling it takes the site offline. GitHub rewrites
  this file if you change the domain in Settings → Pages, so pull afterwards.
- **`.nojekyll`** is empty on purpose. It stops GitHub from running the files
  through a blog generator before publishing them.

## A note on the two versions

- **`quanverge-site/`** — this folder. **This is the website.** All content
  edits happen here.
- **`quanverge-web/`** — an older React version of the same design. It is
  **parked**: it is not the public site and is no longer kept in sync. It is
  retained only because the face-recognition login is built there.

Do not edit the React version expecting the website to change.
