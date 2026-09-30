# Scroll intro frames

The scroll film comes from the existing 3840 × 2160 Atlas-source video at `ligarent/dist/assets/ligarent-intro-scroll-seedream-first-4k.mp4`. No new media generation or API charge.

Each `.frames` bundle starts with a little-endian uint32 frame count, then that many little-endian uint32 frame lengths and WebP payloads. The public bundle keeps every second source frame plus the final frame: 59 frames in one request. At the site's roughly 1.15-second automatic handoff, this is about 50 displayed frames per second.

- Desktop: 1280 × 720 WebP frames, about 2.4 MiB packed; first and last stills use the same resolution.
- Portrait phones: 500 × 1080 WebP frames, about 1.7 MiB packed; first and last stills use the same resolution.
- Decoding 59 display-sized frames instead of 116 larger ones reduces startup CPU and memory use. The first still remains visible while the bundle prepares.

Clips 2–4 play first as a separate 1280 × 720 H.264 reel. The web version is accelerated to 5.5 seconds in the file itself and plays at normal speed, with its MP4 metadata at the front for streaming. It is about 1.9 MiB. Its 70 KiB poster and a direct “Пропустить видео” link are available immediately. The reel releases on end, error, or an 8-second failsafe. If the scroll film is still preparing, the poster controls open `site.html` directly rather than blocking the visitor.

The public `index.html` redirects into `start.html`. Returning from the live site bypasses the opening reel and restores the scroll film directly.
