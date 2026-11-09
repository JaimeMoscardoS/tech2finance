# Module 3 Simulator Implementation Plan

> **For agentic workers:** Execute the bounded tasks below; independent review follows before any commit.

**Goal:** Provide a portable, deterministic educational simulator with honest provenance and reproducible CLI.

**Architecture:** A validated immutable series feeds pure historical, comparison and drawdown functions. A separate deterministic scenario function and JSON CLI share strict validation and structured errors.

**Tech Stack:** Python >=3.11 standard library, Decimal, unittest.

**Spec:** `docs/simulador-historico.md`, `docs/contratos.md` and the module 3 assignment.

## Global Constraints

No network, external dependencies, server, UI, real customer data or invented historical observations. Never claim declared provenance is verified. No commit before review.

## Review Focus

Gaps and multiple scheduled deposits: process every event or reject missing coverage. Non-finite/boolean values: reject at every API boundary. Fees: distinguish transaction costs from embedded costs. Adjusted series: label synthetic units. End-of-series drawdowns: report open episodes.

### Task 1: Series and historical engine

**Files:** `simulador/series.py`, `simulador/engine.py`, `simulador/tests/test_engine.py`, `simulador/fixtures/*`.

- [x] Validate JSON/CSV inputs, metadata, observations, coverage and declared gaps; expose `load_series(path, metadata_path=None)`.
- [x] Implement `simulate(series, request)` and `compare(series, request)` with scheduled deposits and explicitly priced virtual transactions.
- [x] Test known cashflows, fees, weekend events, missing coverage, adjusted labels and invalid types.

### Task 2: Scenarios and drawdowns

**Files:** `simulador/analysis.py`, `simulador/tests/test_engine.py`.

- [x] Implement `scenarios(request)` with monthly effective compounding; test zero and negative rates.
- [x] Implement `drawdowns(series, threshold)` with recovered and open episodes and conservative evidence gaps; test manual peaks and troughs.

### Task 3: CLI and contracts

**Files:** `simulador/__init__.py`, `simulador/__main__.py`, `simulador/README.md`, relevant `docs/*.md`, `simulador/tests/test_cli.py`.

- [x] Expose versioned JSON commands and structured validation errors; test actual subprocess success and failure.
- [x] Document exact inputs, outputs, assumptions, examples, evidence and integration status.
- [x] Run `python -m unittest discover -s simulador/tests -v` and submit implementation and evidence for independent mathematical review.

## Review and evidence

Initial local suite: 12 tests passed. Independent review round 1 scored 7/10 and identified extreme numeric input, metadata serialization and caller decimal context issues; corrections and regression tests are included. Independent review round 2: 9/10, no critical, high or medium findings; 15 tests passed on Windows with Python 3.14. Real data, comparables, causal explanations and service integration remain outside this delivery. The only bundled series is synthetic.
