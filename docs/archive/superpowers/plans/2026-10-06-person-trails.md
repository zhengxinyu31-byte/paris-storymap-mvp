# Paris person trails implementation plan

> For agentic workers: implement inline using executing-plans. The user has authorized the demo update.

**Goal:** Make existing Paris stories discoverable through people, time and place, with reliable return to the original route.

**Architecture:** Preserve the POI → stories → route-stop structure. Derive an entity index from the existing sourced stories, including original date labels and explicitly conservative sorting dates. Hash URLs preserve a bounded branch origin. No generation backend is required.

**Tech Stack:** Existing React 18, Vite, MapLibre and Node tests.

**Spec:** User request: learn from cuizicheng1024/storymap; retain celebrity anecdotes and minimize user input.

## Constraints
- Retain 119 POIs, 260 stories and 16 persona routes; routes remain 6–8 chapters.
- Do not invent missing dates, locations, biographical facts or walking paths.
- Sources, caveats, fictional stories and approximate map pins stay distinguishable.
- Preserve v2 and its saved progress; create preview v3 on port 5175.

## Review focus
- A branch must not accidentally mark a main chapter read.
- Sharing/reloading an entity or branch preserves its return point.
- Unknown dates remain visible; dates in separate clauses are not continuous life spans.
- Missing coordinates keep the story in the timeline with a visible explanation.
- Mobile and unavailable map tiles must retain usable reading controls.

## Tasks
1. Add failing model tests for entity alias aggregation, chronological sorting with unknowns retained, bounded return context and guided reading isolation. Implement in model.mjs and trails.mjs; run npm test.
2. Add EntityTrail.jsx and StoryQuestions.jsx; integrate full-page person/work trails and branch return controls into App.jsx. Add derived entity catalog JSON generation and documentation of editorial time semantics.
3. Update MapView to distinguish overview from selected-place focus, avoid duplicate marker overlap and retain fallback controls. Lazy-load map code.
4. Exercise main route → alternate story → person → story → original chapter in Playwright, including refresh, mobile, map outage and all 16 routes. Build, capture screenshots, and package preview/source/KB.
