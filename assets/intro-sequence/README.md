# Scroll intro frames

Extracted locally from `assets/ligarent-intro-first-1080p-scrub.mp4`; no generated or paid media.

- First clip only: 87 frames at 12 fps, numbered 000–086.
- Desktop: 960 × 540 WebP, 3,483,450 bytes total.
- Mobile: 640 × 360 WebP, 2,002,990 bytes total.
- FFmpeg extraction: `-vf "fps=12,scale=960:-1" -q:v 3 -frames:v 87 -start_number 0 frame-%03d.jpg`.
- Pillow WebP conversion: quality 72, method 6; mobile resized with LANCZOS.
- Frame 000 is also the preloaded opening background, avoiding a mismatched poster/video cut.
- Decode before enabling scrolling, then draw synchronously to canvas. Frame, text mask, and transition all derive from scroll position; no video seeks or playback clock.
