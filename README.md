# Energy Digest

Static site, no build step. Published via GitHub Pages from this repo.

## Structure

```
index.html                          →  /                     landing page, blob + two entry cards
tracker/index.html                  →  /tracker/             the funding tracker (was energy-digest_v59.html)
podcast/index.html                  →  /podcast/             episode list
podcast/episodes/<slug>.html        →  /podcast/episodes/…   one page per episode
podcast/episodes/_template.html     →  not linked; copy this to start a new episode
podcast/audio/                      →  put self-hosted mp3s here
assets/site.css                     →  styles for the landing and podcast pages
assets/blob.js                      →  the WebGL gradient background
assets/img/                         →  card artwork
404.html                            →  not-found page
.nojekyll                           →  stops GitHub Pages ignoring _template.html
```

The tracker page keeps its own self-contained CSS. Only its nav bar was changed.

## Publishing a new episode

1. Copy `podcast/episodes/_template.html` to `podcast/episodes/your-slug.html`.
2. Fill in every block marked `<!-- ===== FILL IN ===== -->`.
3. Pick a player option in the `.player` block (self-hosted audio, YouTube or
   Spotify) and delete the other two. If you use an embed, add that domain to
   `frame-src` in the page's CSP meta tag; the comment above it says which.
4. Add an entry to the **top** of the `EPISODES` array in `podcast/index.html`.
   `slug` must match the filename without `.html`.
5. Update the prev/next links at the bottom of the neighbouring episode pages.

## Changing the gradient

Everything lives in `BLOB_CONFIG` at the top of `assets/blob.js`. Values are on a
0–100 scale. Current locked settings:

| key | value | effect |
|---|---|---|
| `size` | 92 | how much of the frame the blob fills |
| `edge` | 70 | edge feathering |
| `flow` | 20 | speed of the interior churn |
| `turbulence` | 34 | how hard the interior folds |
| `drift` | 27 | how much the outline wanders |
| `grain` | 27 | film grain |

Individual pages can override without touching the shared file, e.g. the podcast
page calls `initBlob(canvas, { size: 62, edge: 82 })`.

**If you change `cream`, change `--cream` in `assets/site.css` to match**: they are
the same colour in two places, and a mismatch shows as a faint ring at the blob's edge.

## Deploying to the existing repo

The repo currently holds two files: `CNAME` and `index.html`, where `index.html`
IS the tracker. This release restructures that:

```
before                          after
  CNAME                           CNAME          <- keep, do not touch
  index.html   (the tracker)      index.html     <- NEW landing page
                                  tracker/index.html  <- the tracker moves here
                                  podcast/...
                                  assets/...
                                  404.html
                                  .nojekyll
```

**Keep `CNAME`.** It is what binds the custom domain. It is deliberately not in
the zip so it cannot be overwritten. If it is ever deleted, the custom domain
detaches and the site falls back to the github.io address.

**The tracker's URL changes** from the site root to `/tracker/`. Anyone with the
old link lands on the new home page instead, one click away. Nothing 404s.

## GitHub Pages setup

Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.

If you use a custom domain (energy.bigbook.vc), add a `CNAME` file at the repo root
containing just the hostname, and point a DNS CNAME record at `<user>.github.io`.

## Notes

- All internal links are relative, so the site works at a subpath
  (`user.github.io/energy-digest/`) as well as at a custom domain root.
- Every page carries a Content-Security-Policy meta tag. If you add an external
  script, font, image or iframe, the CSP has to be widened or the browser blocks it.

## Palette

One palette across the whole site. The values live in two places and must agree:
`assets/site.css` `:root` for the landing and podcast pages, and the `:root` block
at the top of `tracker/index.html`.

| role | value | tracker variable |
|---|---|---|
| page background | `#F7EFE7` | `--cream` |
| panel / card | `#FCF8F3` | `--card` |
| ink, and dark surfaces | `#100F0D` | `--navy` |
| accent on light | `#B0730F` | `--accent-deep` |
| accent on dark | `#E9CC6F` | `--orange` |
| teal | `#12756E` | `--teal` |

The tracker keeps its dark nav, hero and footer; those are now ink rather than navy,
with cream text on them. The variable is still called `--navy` for historical reasons.

## Guest portraits

`assets/img/people/<firstname-lastname>.jpg`, 256x256, square, JPEG quality 88.

They are cropped from the TheOnePoint quote cards, which share one template at
1280x720: the guest panel is x 784 to 1029, the host panel x 1035 to 1279, both
y 140 to 459. Square-crop centred horizontally with a 5% downward bias so the head
sits correctly inside a circle.

In the page, an avatar with a photo takes the `photo` class and a background image;
the initials stay in the markup as the fallback:

```html
<div class="av photo" style="background-image:url('../../assets/img/people/jan-lozek.jpg')">JL</div>
```

## House rules for edits

Three conventions this site follows. Anything added later should match.

**No em dashes.** Use a colon, a semicolon, or a comma and a conjunction instead.
Applies to visible copy, meta descriptions and code comments alike.

**Links are not underlined at rest.** They underline on hover, via
`text-decoration:underline;text-underline-offset:3px`. Do not add `border-bottom`
to an anchor as a permanent underline.

**Every outbound link carries the campaign string:**

```
?utm_source=bigbook.vc&utm_medium=referral&utm_campaign=energy-digest
```

Use `&` instead of `?` if the URL already has a query string. Links to our own
domains (bigbook.vc and its subdomains) are the exception and carry no tag, since a
self-referral would pollute the analytics. Share buttons
(X, LinkedIn, email) carry it inside the encoded target URL rather than on the
share endpoint itself, so the tag survives the share. Font and CDN `<link>` tags
are not tagged.

**Horizontal rules in the Mentioned list sit above group headings only**, never
under individual records.

**Linked names carry a small arrow.** Because underlines only appear on hover,
an arrow after the name is what marks an entry as clickable. Outbound links get
a north-east arrow, internal ones a right arrow, applied automatically by the
`a.mlink::after` rule. Nothing to add by hand.
