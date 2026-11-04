# Current design

The 2026-11-04 Taste Skill refinement supersedes the November 1 presentation below: record-led hero, one Switzer type family, larger text, interactive model-backed lifecycle preview and an achromatic workspace. Fontshare CSS/font requests are now declared external assets. See [review and validation](TASTE-REVIEW.md).

# 2026-11-01 interface redesign

The portfolio now uses warm off-white surfaces, forest-green accents and an editorial hierarchy. The hero presents an explicitly fictional project card with a locally rendered SVG landscape, recorded limits and lifecycle labels. It is not a live map, a real project location or chain data.

The simulation is a four-step workspace. One operation is shown at a time, next to a persistent project summary and session-only retirement receipts. Successful review, issuance and retirement advance the current step. Every step can also be selected directly; the shared model rejects out-of-order or invalid operations. Users can revisit completed steps, reuse a receipt ID, and reset the whole session. Navigating within the page retains session state; a full reload clears it.

The implementation reuses the pure simulation model. It adds no dependencies, remote font/asset host, wallet requests or RPC calls. Inputs and session records remain React text, including beneficiary strings. The independent blockchain interface and its Sepolia configuration checks remain available.

English headings use a system serif; Chinese headings use the system sans family without forced italics. The layout adapts from 320px to desktop, with a compact project summary on mobile. Subtle landscape/reveal/number motion respects the pause control and prefers-reduced-motion. The architecture remains keyboard-selectable.

## Validation

Run the optional browser smoke test with an existing Playwright and Chrome installation:

```sh
node fronted/test/motion.smoke.cjs
```

The default target is http://127.0.0.1:18082. Set PORTFOLIO_URL to test another local or deployed build; MOTION_SCREENSHOT_DIR changes the screenshot destination. The script checks the lifecycle, errors, query recovery, navigation/reset, bilingual layouts at 320-1440px, architecture, keyboard, motion preferences, disabled unconfigured wallets, and unexpected network/page failures.

Frontend model and query tests remain `npm --prefix fronted test` and `npm --prefix fronted run test:acceptance`. See [release validation](RELEASE-VALIDATION.md) for counts and deployment boundaries. The older 2026-10-27 video is a local historical recording; the repository contains the recording script, not that binary video.
