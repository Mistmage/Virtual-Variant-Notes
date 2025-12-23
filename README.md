# Virtual Variant Notes

Create virtual versions of notes assembled from parts of other notes. Virtual notes behave like regular notes visually, but they are not files; they render in dedicated views and in a preview modal.

## Features
- Assemble variants from headings, blocks, sections, and frontmatter of source notes.
- Reference a YAML pattern via frontmatter to define variants and sources.
- Preview variants and open each as an in-memory virtual note view.
- Optionally auto-refresh virtual views when source notes change.

## Usage
- Add frontmatter to a note:
  ```
  ---
  virtual_workflow: my-note-variants
  virtual_sources:
    ref: Notes/Reference.md
  ---
  ```
- Create `Patterns/my-note-variants.yml`:
  ```
  name: My Note Variants
  sources:
    ref: Notes/Reference.md
  variants:
    - id: short
      name: Short Version
      frontmatter:
        type: short
      assemble:
        - source: current
          include:
            headings: ["Summary"]
            blocks: ["b123abc"]
            frontmatter: ["tags"]
    - id: full
      name: Full Version
      assemble:
        - source: current
          include:
            all: true
        - source: ref
          include:
            headings: ["Appendix"]
  ```
- Run commands:
  - `Virtual notes: Preview variants` to browse and open a variant.
  - `Virtual notes: Open first variant` to open directly in a leaf.

## Settings
- Pattern folder: default `Patterns`
- Default mode: separate virtual notes or single note variants
- Auto update: refresh virtual views on source changes

## Warnings
- Virtual notes are not files. They do not persist on disk and do not appear in file-based queries that read the vault file system.
- Frontmatter merging may overwrite keys. Variant-defined frontmatter takes precedence over copied source keys; ensure namespacing to avoid collisions.
- Pattern path normalization: if `virtual_workflow` omits extension, `.yml` in the Pattern folder is assumed. Provide explicit paths if your structure differs.
- Source aliases: missing or mistyped aliases will result in skipped content; verify `sources` in the pattern and `virtual_sources` in the note frontmatter.
- Headings detection uses Obsidian’s metadata cache. If heading text is duplicated within a file, only the first match is used for `headings: ["Title"]`.
- Blocks rely on Obsidian block IDs. If a block isn’t indexed in the cache yet, it may be skipped until the note is saved and the cache updates.
- Deprecated API: older `MarkdownRenderer.renderMarkdown` is replaced internally; Obsidian may deprecate APIs over time. Keep to the current app version in `manifest.json`.
- Performance: assembling across large files and multiple variants may be expensive. Enable `Auto update` cautiously in large vaults.
- Mobile differences: Obsidian mobile may handle views differently; features that rely on desktop-only APIs won’t be available.
- Security: do not include secrets in frontmatter or patterns. Virtual notes render content verbatim; sensitive data can surface unexpectedly.
- Compatibility: plugins that transform Markdown at render-time may affect virtual views. Test with your plugin set.
- Staleness: the metadata cache can lag after rapid edits. If content appears outdated, save the source note and re-open the virtual variant.

## Build
- Node 18+
- `npm install`
- Development: `npm run dev`
- Production bundle: `npm run build` or `node esbuild.config.mjs production`

## Install
- Copy `manifest.json`, `main.js`, `styles.css` (optional) to:
  - `<Vault>/.obsidian/plugins/virtual-variant-notes/`
- Enable the plugin in Obsidian.

## Release
- Tag the exact semantic version (no leading `v`).
- Create a GitHub release and attach:
  - `manifest.json`
  - `main.js`
  - `styles.css` (optional)
