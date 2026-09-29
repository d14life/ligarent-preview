# Scroll intro frames

Extracted locally from the existing `assets/ligarent-intro-first-1080p-scrub.mp4`. No generated or paid media.

87 WebP frames at 12 fps are packed into one file per viewport size. Each bundle starts with a little-endian uint32 frame count (87), followed by 87 little-endian uint32 frame lengths and the corresponding WebP bytes. This reduces the sequence from 87 network requests to one. `desktop/frame-000.webp` stays separate so the first image can render immediately.

- Desktop: 960 × 540, 3,483,802-byte bundle.
- Mobile: 640 × 360, 2,003,342-byte bundle.
- The original extracted frames remain in the local source checkout for regeneration; the public preview only needs the two bundles and opening frame.
- The scroll-controlled intro decodes its bundle without loading the website in an iframe. Its opening image and site links are usable as soon as the reel closes. Wheel, touch, and keyboard input update a logical intro position independent of browser page-scroll limits; the last frame opens `site.html` as the top-level page. At the top of `site.html`, upward input returns to the last intro frame and can keep rewinding to the opening page. The public `index.html` redirects into the intro and must never be used as an exit target.
- A separate clips 2–4 opening reel uses the existing local media, optimized to a 720p, 4.3 MB MP4 without paid generation. Its poster appears immediately; it has no speed-up button, releases on video end or error, and has a 12-second failsafe. Returning from the website bypasses the reel and opens the scrubbed frames directly.
