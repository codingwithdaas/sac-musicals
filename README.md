# SacMusicals

The website for [SacMusicals](https://sacmusicals.com), a home-based tabla making, reheading and repair service in Sacramento, California.

Plain HTML, CSS and JavaScript. There is no build step for the site itself: upload the files and it runs.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home. The 3D tabla hero and scroll dive, then Services, Hear our dayans, Our story and Contact |
| `products.html` | Dayan videos, copper duggas and shells, accessories |
| `faqs.html` | FAQs, with tap-to-define terms (reheading, pudda, dugga) |
| `privacy-policy.html`, `terms-of-service.html` | Legal pages |
| `success.html` | Where the contact form lands after sending |
| `about-us.html`, `contact.html`, `reviews.html` | Redirects, so old links keep working |

## What's inside `assets/`

- `site.css` holds all styles. Colours and fonts are the variables at the top.
- `site.js` handles smooth scrolling, the menu, the tabla dive, the video players, the FAQ pop-ups and the form.
- `tabla.js` is the 3D tabla, built with three.js. Its source is in `build/src/tabla.js` in the working copy.
- `audio.js` makes the tabla sounds when a drum head is tapped.
- `cookie-consent.js` is the cookie banner and Google Analytics consent. It is unchanged from the old site.
- `vendor/` holds GSAP, ScrollTrigger and Lenis, stored locally.
- `fonts/` holds Bodoni Moda and Hanken Grotesk, self-hosted.
- `img/`, `video/` and `logo/` hold the photos, compressed dayan videos and the SM logo.

The old `-assets` folder and the old `*-style.css` files are no longer used. They can be deleted once you're happy.

## Common edits

- **Text:** edit the HTML directly.
- **Add a dayan video:**
  1. Put an `.mp4` and a `.jpg` poster with the same name in `assets/video/`.
  2. Copy one of the `<figure class="vcard">` blocks in `products.html` and change its `data-video`.
- **Contact form:** it posts to Web3Forms with the same access key as before, and lands on `success.html`.
- **Reviews:** the section is held back until real reviews are sent in.

## Preview locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. The 3D tabla loads as a module, so open the site through a server rather than double-clicking the file.
