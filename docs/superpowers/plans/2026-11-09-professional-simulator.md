# Professional Simulator Implementation Plan

> **For agentic workers:** Use the assigned parallel development workflow and preserve the file ownership boundaries below.

**Goal:** Add annual contributions to the historical example and improve the clarity, accessibility and responsiveness of the existing simulator.

**Architecture:** Keep the financial calculation, chart component and application integration under separate ownership, with a shared contract agreed before implementation. The historical example remains local and based on the five published annual returns; the chart presents the calculated value and contributions without inventing intermediate observations.

**Tech Stack:** React, TypeScript, Vite, Recharts 3, Node tests and Playwright.

**Spec:** User request and coordination decisions recorded in this session; incorporate the baseline audit findings below.

## Global Constraints

- Add the annual contribution at each year end after that year's return: five contributions in 2021–2025; zero preserves the previous calculation.
- Show contributed capital separately from gain or loss. Keep fictional scenarios clearly distinguished from the sourced annual example.
- Preserve the existing Valle palette, ReactBits CountUp, three levels, Spanish/English, light/dark themes and mobile layout.
- Do not add banking connectivity, authentication, backend, Claude or other unimplemented services.
- Use a pinned exact Recharts 3 dependency and update only the required lockfile entries; do not upgrade unrelated dependencies.
- Preserve other workers' changes. Do not make concurrent Git mutations or commit until the integrated change has been reviewed.
- Cap both monetary inputs at 10⁹ EUR, in both calculation modes. Annual and monthly input states remain separate.

## Shared interfaces

The finance worker exports `SimulationResult` from `frontend/src/simulation-types.ts`: `kind`, `points`, `timeline`, `value`, `contributed`, `profit` and nullable `simpleReturnPercent`. Each `TimelinePoint` contains `period`, nullable `date`, `valueBeforeContribution`, `contribution`, `contributed`, `value`, `profit`, `instrumentReturnPercent` and nullable `periodReturn`. Period zero is the initial amount, dated 2020-12-31 for annual history and undated for monthly examples. Annual contributions occur after each annual return; fictional monthly contributions retain their existing beginning-of-month rule. `MAX_SIMULATION_AMOUNT` is 10⁹. `replayAnnual(initial, annual=0)` and `simulate(initial, monthly, months, returns?)` produce this shared shape.

The chart worker exports `ChartDatum` from `frontend/src/components/InvestmentChart.tsx` as `{label, value, contributed, returnPercent}` and accepts `data`, `language`, `title`, optional `description`, `initialView` and `compact`. `returnPercent` maps to `instrumentReturnPercent`, not gain divided by total contributions. The chart provides euro/percentage views and an equivalent table.

## Baseline audit priorities

- Replace the simulator's unlabeled plot; align the grid to the top, reduce excess blank space, and increase visual hierarchy of the final value and secondary metrics.
- Make instrument name, source and annual rules visible; clearly announce dirty, unavailable and error states without displaying stale results.
- Fix English dark layout at 768 px, scroll the pause dialog on short landscape screens, and make background content inert while the mobile menu is open without hiding active dialogs.
- Rename the navigation item that incorrectly implies a distinct concepts screen. Respect reduced motion and preserve existing theme and language controls.
- The historical oracle for initial 500 and annual 100 is value 1048.553091403868444065, contributed 1000, profit 48.553091403868444065. Annual 50 yields 788.788213436543049065, contributed 750.

## Review Focus

- Annual contributions at year end: test zero, positive and invalid values, five deposits, and independently calculated reference cases.
- Losses and flat or zero values: ensure chart and table show accurate values without invalid scales or fabricated intermediate observations.
- Switching instrument, level, language or theme: ensure values, source and labels stay consistent and never display a stale result as current.
- Keyboard and touch access: exercise the chart's accessible interaction and equivalent table at desktop and 320 px widths.
- Missing data and invalid inputs: show understandable states without fabricated results, overflow or unhandled errors.

## Work packages and ownership

### Financial calculation and tests

**Owner:** finance executor. **Files:** `frontend/src/annual-history.ts`, `frontend/src/demo.ts`, `frontend/src/simulation-types*`, financial tests, and any separately assigned Python simulator files and tests.

- [x] Receive the shared calculation contract and baseline audit findings.
- [x] Add independent reference tests for the specified contribution timing, zero contribution, losses and boundary validation.
- [x] Implement and verify the financial result and dated points under the agreed contract.
- [x] Report exact commands, outcomes and remaining limits to the integrator; do not commit independently.

### Investment chart

**Owner:** chart executor. **Files:** `InvestmentChart.tsx`, its dedicated CSS and chart-specific helpers/tests.

- [x] Receive the agreed dated series interface; use the exact Recharts 3 version installed by the integrator.
- [x] Implement a responsive chart with date and EUR/percentage context, portfolio and contributed-capital series, tooltip interaction, accessibility support and an equivalent data table.
- [x] Verify keyboard and mobile interactions, loss, flat, zero and large-value cases; report evidence and limitations without editing the integrator's files. Touch emulation is not a physical-device test.

### Application integration and documentation

**Owner:** frontend integrator. **Files:** `frontend/src/App.tsx`, `copy.ts`, global styles, catalogue if required, frontend integration tests, package manifest/lock and affected project documentation.

- [x] Incorporate audit findings and the final shared contract before modifying the application.
- [x] Install Recharts 3.10.1 exactly without unrelated dependency upgrades.
- [x] Connect annual input and chart to the finance output while preserving instrument identity, period, language, level and theme.
- [x] Test historical and fictional flows, contribution preservation, source and missing-data states, accessible interactions and responsive layouts in both themes and languages.
- [x] Update contracts and user-facing project context, linking to the authoritative details.

### Integrated verification and review

- [x] Run financial unit tests, chart checks, frontend unit tests, Playwright and production build; inspect desktop and mobile screenshots.
- [x] Request independent review against the audit findings, quantitative rules, accessibility and source labelling; address findings within the repository's maximum four review rounds.
- [ ] Only after review passes with no critical or high findings, prepare the commit and pull request against `main`; do not merge.

## Current handoff

The integrated frontend passed seven Node tests and seventeen Playwright tests. The isolated Python suite passed 21 tests. Desktop, mobile, tablet and short-landscape captures are in `frontend/test-results/` for local inspection. The chart and app build as separate chunks; this is a bundle-size observation, not a runtime performance measurement. The build emits pre-existing `use client` module-directive warnings from CountUp/Motion. Chrome was used with emulated viewports; Firefox and WebKit were not installed and no screen-reader or other-OS test is claimed. Neither the bank nor the proposed AI services are connected.

Baseline review was round 1. The final specialist scores after focused corrections were: quantitative 8.7/10 and security 9.0/10 in round 2; design 8.6/10, accessibility 9.0/10 and architecture/QA 8.6/10 in round 3. Reviewers reported no outstanding critical, high or demonstrated medium findings. These scores and checks do not certify production readiness or complete accessibility conformance.
