# Scroll intro frames

Extracted locally from the existing 3840 × 2160 Atlas-source video at `ligarent/dist/assets/ligarent-intro-scroll-seedream-first-4k.mp4`. No new media generation or API charge.

116 WebP frames at 16 fps are packed into one file per viewport size. Each bundle starts with a little-endian uint32 frame count (116), followed by 116 little-endian uint32 frame lengths and the corresponding WebP bytes. This reduces the sequence to one request per viewport size. The opening stills come from the first native 4K video frame, so they render sharply before the sequence is decoded.

- Desktop: 960 × 540 frames, 5,909,736-byte bundle; separate 3840 × 2160 opening still.
- Portrait phones: the 4K source is cropped at x = 1790 to 1000 × 2160, then scaled to 512 × 1106 frames; 5,252,904-byte bundle and separate native-resolution crop for the opening still.
- The local 4K video is the regeneration source. The public preview contains only the bundles and first/last stills.
- The scroll-controlled intro decodes its bundle without loading the website in an iframe. Its opening image and site links are usable as soon as the reel closes. About 220 px of deliberate wheel or finger travel covers the first clip, so one ordinary swipe can reach `site.html`; releasing the gesture freezes the current frame, and dragging back rewinds it. At the top of `site.html`, upward input returns to the film and can keep rewinding to the opening page. The public `index.html` redirects into the intro and must never be used as an exit target.
- A separate clips 2–4 opening reel uses the existing local media, optimized to a 720p, 4.3 MB MP4 without paid generation. Its poster appears immediately; it has no speed-up button, releases on video end or error, and has a 12-second failsafe. Returning from the website bypasses the reel and opens the scrubbed frames directly.
