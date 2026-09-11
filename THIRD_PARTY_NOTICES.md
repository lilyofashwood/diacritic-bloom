# Third-party notices

Diacritic Bloom's letter-and-mark design is Lily of Ashwood's work, with
AI-assisted implementation and design. The project is released under the MIT
license in `LICENSE`.

## Mulberry32

The seeded visual-variation generator in `src/core.js`, embedded in
`bloom.mjs` and `diacritic-bloom.html`, implements Mulberry32.

- Algorithm: Tommy Ettinger, 2017. The original implementation is dedicated to
  the public domain under CC0:
  https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
- JavaScript implementation reference: bryc's PRNG collection, published with
  an explicit public-domain dedication:
  https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32

These credits apply to the repeatable number generator, not to the project's
Unicode styling architecture or original specimen. The public-domain material
retains that status.

## Unicode references

The specification links to Unicode's public character listings and technical
documentation for character names, assigned code points, segmentation and
normalization. The workshop uses system fonts; it bundles no font software.
