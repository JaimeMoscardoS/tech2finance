# Local Tutor, Voice and Decline Analysis Plan

> **For agentic workers:** Implement only within assigned ownership. The domain and voice interfaces must be agreed before integrating their components.

**Goal:** Deliver a local, contextual educational assistant, optional device voice and a non-blocking explanation of observed declines without provider API keys.

**Architecture:** A pure TypeScript rules provider and decline analysis live under `tutor-ia/src`; the React frontend passes explicit snapshots and renders stable messages and evidence. Device-only voice is isolated in `frontend/src/voice` and its own controls. Future providers remain behind interfaces and require a server for credentials; no provider or banking backend is added here.

**Stack:** React, TypeScript, Vite, existing local tests and Playwright, browser speech capabilities when safely available.

## Constraints

- Label the assistant as local rule-based behavior; do not imply an LLM, news feed or external voice service is connected.
- Keep source, data kind and context attached to each response; never recalculate old messages using later settings.
- Analyze the investment index from simulation, not a contributed portfolio balance. The separate example portfolio is fictional and has point labels, not invented dates.
- Show missing information and observed limits. Do not invent causes or recoveries, guarantee future outcomes, recommend transactions or block the user.
- Use only on-device voice. Never send dictation automatically; text remains editable and usable if voice is unavailable. Never install speech models or fall back to cloud recognition.
- Preserve Spanish/English, three levels, light/dark themes, responsive layout, keyboard access, focus handling, existing chart and reduced motion.
- No keys, external provider calls or banking operations; future secrets belong only on a server outside the browser bundle.

## Work and ownership

1. **Domain worker:** `tutor-ia/src/**`, tests and its package/README. Define the local provider interface, input validation, contextual responses and deterministic decline report. Prove peak-to-last, recovered and open episodes, missing data and no causal claims.
2. **Voice worker:** `frontend/src/voice/**`, `VoiceControls.tsx` and its CSS. Define the device-only interfaces and explicit unavailable, permission, cancellation and cleanup states. Verify speech synthesis uses local voices and recognition requires installed local processing support.
3. **UI integrator:** `frontend/src/App.tsx`, `Simulator.tsx`, assistant and pause panels, shared copy/styles, frontend tests/config and project documentation. Integrate only after receiving the domain and voice contracts. Preserve other workers' files.

## Integration and evidence

- [x] Connect local assistant with bounded input, stable conversation snapshots, contextual suggestions, cancellation, errors, explicit mode and source labels.
- [x] Render decline analysis for example portfolio and valid simulator results, with honest no-current-decline and missing-news states; optional goals, horizon and liquidity remain educational context only.
- [x] Integrate voice controls with fallback to text; ensure closing a dialog cancels device speech and active recognition.
- [x] Verify local unit tests, UI interaction with mocked voice, absence of Anthropic/ElevenLabs calls in the tested flow, build and desktop/mobile/landscape captures.
- [x] Update integration contracts and context, distinguishing implemented local mode from future external APIs and server-side secrets.
- [x] Obtain focused independent reviews for grounding, security and UX/accessibility; resolve critical/high findings and meet the repository review threshold within four rounds before any commit or PR.

## Evidence and limits

The final local run passed 16 Node tests and 23 Playwright tests, and the production build succeeded with existing module-directive warnings. Chrome was tested using emulated desktop, 320 px mobile, tablet and 568 × 320 landscape viewports; screenshots are under `frontend/test-results/`. Dictation and speech interaction were tested with doubles, not audible output or a real microphone. The host reported local system voices; its local recognition package was not already installed, so no model was downloaded. The tested flow made no Anthropic or ElevenLabs calls; this does not imply the page made no network requests, as inherited fonts may use the network. Firefox, WebKit, a physical device and a screen reader were not tested.

Final focused round 2 scores: quantitative/grounding 8.6/10, security 9.1/10 and accessibility 9.0/10. The accessibility reviewer verified landscape scrolling, keyboard focus and Escape, and retained message language after switching the interface. No critical or high findings remain open. Two rounds were used out of the maximum four; these checks do not establish full accessibility conformance or production readiness.
