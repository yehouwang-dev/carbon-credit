# Taste Skill review, 4 November 2026

## Method and source

Applied the user-requested [Taste Skill](https://github.com/Leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/skills/taste-skill/SKILL.md), pinned to commit `12af471f627f866411b4bd785b19646d3672784c`. It was read and run from a temporary reference checkout, not installed globally. Its draw, lint and real-browser inspector scripts were used. Optional screenshot and browser-profile deletion was disabled in that temporary copy to follow the user's no-bulk-delete rule; inspection rules were unchanged. Temporary reports and profiles were retained.

Page direction: **One motif**, seed **20261104**. App direction: **Achromatic ledger**, same seed. The page uses the existing green palette with a cooler, low-chroma ground and the dealt **Switzer** face, loaded through Fontshare's public CSS/font service. Chinese falls back to the system Chinese font. No packages were added. Font requests are declared external assets; wallet/RPC requests remain absent from the overview and simulation.

## Brief, inventory and argument

Audience: graduate admissions reviewers and visitors trying the research prototype. Primary action: try the wallet-free lifecycle simulation.

Subject inventory: SIM-PROJECT-1; a reviewed fictional project; a 100 CC cumulative cap; issuance of 100 CC; retirement of 10 CC for Portfolio Demo; a remaining balance of 90 CC; zero remaining issuance capacity; SIM-ONLY-0001; browser-session reset; separately configured blockchain access; explicit administrator trust; independent governance primitives.

Argument and proof:

- The prototype connects credit records. Show its retirement record, not an atmospheric landscape.
- The lifecycle changes inspectable state. Show four states from the same pure model used by the simulator, and let a visitor select a stage.
- Key behavior is tested. Present dated contract/query validation results and link the report.
- The system has defined responsibilities. Keep the selectable architecture and complete diagram.
- Records have trust limits. State the administrator, provenance and environmental-certification boundaries.

Idea: on this page, the project's session-only retirement record becomes the cut-corner sheet that frames the interface. Its exact example, cap and balance carry the idea through the page. The concept remains a familiar ledger metaphor, so creativity is assessed conservatively.

Live thing: selecting Review, Issue, Retire or Query changes cap, issued, retired and balance from model-generated states. The full workspace remains a separate working walkthrough. In-page navigation preserves its session; reloading clears it. `?view=simulation` and `?view=chain` open their corresponding views.

Content adjustments to the dealt sheet: replaced the logo-board proof with plain result columns because there are no customer logos; replaced the duration-led process with four record fields because no stage durations are measured; kept four complete interface fragments in a readable two-column layout rather than four narrow fields; combined the showcase with the hero/lifecycle, and used project trust boundaries instead of an invented portrait. There are no pinned scroll scenes. These adapt real content rather than inventing proof.

## Before and after measurements

| Check | Before | Final |
| --- | --- | --- |
| Page inspector, 1440/768/390px | 14 FAIL, 11 WARN | 0 FAIL, 2 WARN |
| App inspector, same widths | First updated version: 1 FAIL, 3 WARN | 0 FAIL, 1 WARN |
| Source lint, new page/component stylesheet | Not previously run | 0 FAIL, 1 WARN |
| Desktop headline | Three lines, Georgia, 78px | Two lines, Switzer, about 92px |
| Running page text | 13px | 18px desktop, 16-18px mobile |
| Page font families | Three | One declared main face; system Chinese fallback |
| Readability | Many 8-12px captions and low-contrast labels | No page text below 13px; corrected workbench contrast |

All final inspector screenshots at 1440, 768 and 390 were opened, including full-page sheets. The two remaining page warnings are missing real-world photography and footage: this fictional software prototype is represented by its own model-backed UI fragments, so stock forest images or unrelated footage would add no evidence. The app's remaining row-height warning concerns independent project/form/receipt panes with different content, deliberately top-aligned rather than stretched with empty space. The lint outline warning is the legitimate quiet border on the app's project-summary panel.

Raw reports and screenshots were saved under `/private/tmp/carbon-taste-before`, `/private/tmp/carbon-taste-final` and `/private/tmp/carbon-taste-app-release`. They are local QA artifacts, not repository runtime dependencies.

## Written critique

### Round 1, existing interface

Seen in one second: a green portfolio theme and decorative map.
Idea: a generic ecological presentation around the simulation.
Live thing: the separate lifecycle simulator.
Layout words by section: hero=split / features=columns / lifecycle=list / evidence=split / architecture=panel / boundaries=text.
Scores: design 6.0, usability 6.5, creativity 5.5, content 8.0. Overall 6.2, capped at 6.0 by inspector failures.
Top three problems: desktop/mobile fold screenshots showed a three-line display headline; full-page sheets showed tiny tracked labels; the hero's landscape did not demonstrate a retirement record.

### Round 2, record-led build

Seen in one second: a credit record with an actual session ID.
Idea: the retirement sheet frames the research argument.
Live thing: stage selection and the separate complete workflow.
Layout words by section: hero=artifact split / lifecycle=interactive bar and four fields / proof=typographic results / architecture=selector / boundaries=paired text.
Scores: design 7.2, usability 7.5, creativity 6.5, content 8.0. Overall 7.2, capped at 6.0 while the inspector still reported headline/label failures.
Top three problems: a constrained heading measure created an extra line; the validation link/date read like small labels above large figures on mobile; the workbench had pale step text and placed the project summary before the phone's active task.

### Round 3, final

Seen in one second: carbon-credit records, demonstrated by a legible retirement sheet.
Idea: the session-only record is the visual and explanatory object.
Live thing: model-backed stage selection, plus a complete guided simulation.
Layout words by section: hero=artifact split / lifecycle=state strip and four fields / proof=result columns / architecture=interactive diagram / boundaries=paired text / footer=large wordmark.
Scores: design 7.5, usability 8.0, creativity 6.5, content 8.0. Overall **7.5/10**. This is an internal critique, not an external award or professional jury score.
Caps applied: creativity remains conservative because a ledger metaphor is familiar; no outstanding FAIL cap.
Remaining limitations: no real-world project photography/footage; some medium-sized interface type and independent panel heights remain for readable functional content; the motif could carry a more distinctive motion sequence in a future iteration.

## Assets, samples and validation

No third-party photographs, bundled atmosphere pictures, clips or generated raster assets were used. Interface fragments are React output from the existing prototype model; no grey placeholders or invented usage statistics. Font: [Switzer, Fontshare](https://www.fontshare.com/fonts/switzer), delivered by its official font API. The page remains usable with a system fallback if that service cannot load.

Fictional content remains explicit: Demo Forest, SIM-PROJECT-1, 100 CC cap, 100 issued, 10 retired, 90 balance, beneficiary Portfolio Demo and SIM-ONLY-0001. These are teaching fixtures, not real credits or public-chain certificates. Test counts are dated evidence, not a live service metric.

Frontend model 5/5 and query/security tests 14/14 pass. Production-mode build and the full browser regression pass, including preview state arithmetic, disclosure expansion, out-of-order error, issue/retire/query, missing record recovery, reset, session navigation, keyboard architecture, bilingual 320-1440px layout and reduced motion. Only declared Fontshare stylesheet/font resources may be external; no RPC calls or undeclared resources were observed. Smart contracts were unchanged. Sepolia remains unconfigured.
