# Verification record

## Core module

Observed runtime: Node v22.16.0, ICU 77.1, Unicode 16.0.

Command: `node --test bloom.test.mjs`

Result: **27 tests passed, 0 failed.**

One test covers 896 combinations of 14 families, 4 profiles, 4 mixing modes and 4 seeds. Each uses all printable ASCII plus a mixed-case/digit/punctuation/multiline sample. Another test performs 500 randomized printable-ASCII round trips. Additional tests cover the literal original, NFC/NFD, Unicode letterlike exceptions, pass-through accents and emoji, strict validation, unsupported marks, framing, deterministic recipes and stored golden vectors.

The exact original was also exported through the command-line tool and compared byte for byte with `original-specimen.txt`. An encode/decode CLI pipeline recovered its source.

## Browser interaction checks

Observed runtime: Chromium 144.0.7559.96, Debian GNU/Linux 13.

The page's HTML was loaded into a browser document using Playwright `set_content()`. The test environment's administrator policy blocks direct `file:` navigation, so the local-file opening step was not exercised in that environment. All embedded page code was executed; the app contains no module imports or external resources that would require a web server.

Twelve browser checks passed:

1. Exact original loads; all 14 font options appear; the first glyph exposes five code points.
2. Live encoding/decoding preserves the tested composed/decomposed accents, emoji and keycaps.
3. Mutation, mixed fonts, plain reading view and maximum-density profile work.
4. Invalid strict input clears stale output and disables exports.
5. Original reset and exact-frame stripping work.
6. Original recipe export/import restores exact code points including its optional frame.
7. Generated recipe export/import restores source, seed, mixing mode and output.
8. User-supplied HTML-like strings remain inert text.
9. The copy action passes the exact encoded string to a mocked clipboard API.
10. A blocked clipboard produces the manual-selection fallback.
11. No page JavaScript errors or HTTP requests occurred during the tested interactions.
12. A 390-pixel viewport had no page-level horizontal overflow.

Desktop and narrow-screen screenshots were visually inspected. Browser clipboard permission and OS clipboard integration were not independently tested beyond mocked API behavior and the fallback path. Safari, Firefox and native iOS opening/rendering have not been tested. Identical code points may render differently on other systems.

These tests provide coverage, not a proof that every platform, transformation or arbitrary Unicode source is supported. Refer to the source-domain and normalization contracts in SPEC.md.

## Optional browser harness

`browser.test.py` reproduces the browser checks with Python Playwright. It uses a discovered Chromium executable, or Playwright's installed Chromium; set `BLOOM_CHROMIUM` to an explicit executable path when needed. Unlike the app and Node module, this optional development test requires Playwright and a browser. It writes screenshots and JSON results into `test-artifacts/`.
