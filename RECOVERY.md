# Recovery receipt · 2026-09-10

The complete recovered Diacritic Bloom 1.0.0 source bundle is preserved here. It is a decorative Unicode styling codec and exact JSON recipe format, not a hidden-message protocol. The original literal specimen remains unchanged.

The publishing kit supplied this bundle under `sources/diacritic-bloom`; the original source/protocol/data checksums are retained in `SHA256SUMS.json`. The workspace archive also preserves the source kit. `index.html` is a new launch entry; no existing protocol or artwork was changed to make the new entry.

Attribution: Lily of Ashwood and the collaborative recovered source material. No explicit license file was supplied in this bundle. This is a private review candidate; confirm a license before public release. Previous `TESTING.md` reports describe the earlier session and are not fresh results from this recovery.

The new Zalgo MUX 3.0.0 work uses the same separation between glyph bodies and mark layers, but has its own independent payload framing. It does not rename this visual codec or invent a hidden payload in the original specimen.

Fresh verification on 2026-09-10: all 27 original Node tests pass; deterministic rebuild matches all 17 original SHA256 entries, including both generated artifacts. All readable sources and tables were read in full; generated embedded-table blobs were reviewed by their complete readable sources and byte-identical rebuild, not claimed as independently line-read.

The preserved Python browser harness could not run because this Python environment lacks Playwright. The new `browser.test.cjs` alternative passes exact specimen/font loading, Unicode and mixed-mode roundtrips, strict-error cleanup, recipe export/import, inert text, clipboard/fallback, no HTTP requests or page errors, and 390px mobile overflow. Run `node browser.test.cjs` with Playwright and optional `BLOOM_CHROMIUM`. Desktop/mobile screenshots were inspected. Some dense historical mark combinations render missing-glyph boxes with this host's font fallback; raw code-point recovery remains exact. No original specimen was altered to conceal this rendering limitation.
