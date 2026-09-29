# Scroll intro frames

Extracted locally from the existing `assets/ligarent-intro-first-1080p-scrub.mp4`. No generated or paid media.

87 WebP frames at 12 fps are packed into one file per viewport size. Each bundle starts with a little-endian uint32 frame count (87), followed by 87 little-endian uint32 frame lengths and the corresponding WebP bytes. This reduces the sequence from 87 network requests to one. `desktop/frame-000.webp` stays separate so the first image can render immediately.

- Desktop: 960 × 540, 3,483,802-byte bundle.
- Mobile: 640 × 360, 2,003,342-byte bundle.
- The original extracted frames remain in the local source checkout for regeneration; the public preview only needs the two bundles and opening frame.
- The intro decodes its bundle independently of the embedded website. The opening image and site links are usable immediately; a delayed iframe cannot hold a progress percentage or block the intro.
