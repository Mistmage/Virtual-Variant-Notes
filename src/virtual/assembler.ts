import { App, TFile } from "obsidian";
import { AssembledVariant, VirtualPattern } from "./types";

interface SourceResolution {
  file: TFile;
  content: string;
}

export async function assembleVariants(
  app: App,
  note: TFile,
  pattern: VirtualPattern,
  sourceAliases?: Record<string, string>
): Promise<AssembledVariant[]> {
  const variants: AssembledVariant[] = [];
  for (const v of pattern.variants) {
    const parts: string[] = [];
    const fmAcc: Record<string, unknown> = {
      virtual: true,
      source: note.path,
      variant_id: v.id,
      variant_name: v.name ?? v.id,
    };

    for (const step of v.assemble) {
      const src = await resolveSource(app, note, step.source, pattern.sources, sourceAliases);
      if (!src) continue;
      const cache = app.metadataCache.getFileCache(src.file);

      if (step.include?.all) {
        parts.push(stripFrontmatter(src.content));
      }

      if (step.include?.frontmatter && cache?.frontmatter) {
        for (const key of step.include.frontmatter) {
          if (key in cache.frontmatter) fmAcc[key] = cache.frontmatter[key];
        }
      }

      if (step.include?.blocks && cache?.blocks) {
        for (const bid of step.include.blocks) {
          const blk = (cache.blocks as Record<string, { position: { start: { line: number; col: number }, end: { line: number; col: number } } }>)[bid];
          if (!blk) continue;
          const lines = splitLines(src.content);
          const start = toOffset(lines, blk.position.start);
          const end = toOffset(lines, blk.position.end);
          parts.push(src.content.slice(start, end));
        }
      }

      if (step.include?.headings && cache?.headings) {
        for (const h of step.include.headings) {
          const title = typeof h === "string" ? h : h.title;
          const match = cache.headings.find((hh) => hh.heading === title);
          if (!match) continue;
          const lines = splitLines(src.content);
          const start = toOffset(lines, match.position.start);
          const end = nextHeadingEndOffset(lines, cache.headings, match);
          parts.push(src.content.slice(start, end));
        }
      }

      if (step.include?.sections && cache?.headings) {
        for (const path of step.include.sections) {
          const title = normalizeHeadingPath(path);
          const match = cache.headings.find((hh) => hh.heading === title);
          if (!match) continue;
          const lines = splitLines(src.content);
          const start = toOffset(lines, match.position.start);
          const end = nextHeadingEndOffset(lines, cache.headings, match);
          parts.push(src.content.slice(start, end));
        }
      }
    }

    const mergedFm = { ...(v.frontmatter ?? {}), ...fmAcc };
    const md = [yamlString(mergedFm), "", parts.join("\n\n").trim()].join("\n");
    variants.push({ id: v.id, name: v.name, frontmatter: mergedFm, markdown: md });
  }
  return variants;
}

async function resolveSource(
  app: App,
  note: TFile,
  source: string,
  patternSources?: Record<string, string>,
  noteAliases?: Record<string, string>
): Promise<SourceResolution | null> {
  let path: string;
  if (source === "current") {
    const content = await app.vault.read(note);
    return { file: note, content };
  }
  if (patternSources && patternSources[source]) path = patternSources[source];
  else if (noteAliases && noteAliases[source]) path = noteAliases[source];
  else path = source;

  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return null;
  const content = await app.vault.read(f);
  return { file: f, content };
}

function yamlString(obj: Record<string, unknown>): string {
  const items = Object.entries(obj).map(([k, v]) => `${k}: ${toYamlVal(v)}`);
  return `---\n${items.join("\n")}\n---`;
}

function toYamlVal(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => toYamlVal(x)).join(", ")}]`;
  if (typeof v === "object" && v !== null) {
    const inner = Object.entries(v as Record<string, unknown>)
      .map(([k, vv]) => `${k}: ${toYamlVal(vv)}`)
      .join(", ");
    return `{ ${inner} }`;
  }
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function stripFrontmatter(md: string): string {
  const m = md.match(/^---[\s\S]*?---\n?/);
  return m ? md.slice(m[0].length) : md;
}

function splitLines(content: string): string[] {
  return content.split("\n");
}

function toOffset(lines: string[], pos: { line: number; col: number }): number {
  let offset = 0;
  for (let i = 0; i < pos.line; i++) {
    offset += lines[i]?.length ?? 0;
    offset += 1; // newline
  }
  offset += pos.col;
  return offset;
}

function nextHeadingEndOffset(
  lines: string[],
  headings: { position: { start: { line: number; col: number } } }[],
  current: { position: { start: { line: number; col: number } } }
): number {
  const currentStart = toOffset(lines, current.position.start);
  const after = headings
    .map((h) => toOffset(lines, h.position.start))
    .filter((o) => o > currentStart)
    .sort((a, b) => a - b)[0];
  if (after !== undefined) return after;
  // end of file
  return lines.reduce((acc, l) => acc + l.length + 1, 0) - 1;
}

function normalizeHeadingPath(path: string): string {
  return path.replace(/^#+\s*/, "").trim();
}
