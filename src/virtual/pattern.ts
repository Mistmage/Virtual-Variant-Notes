import { App, TFile, parseYaml } from "obsidian";
import { VirtualPattern } from "./types";

export interface NoteVirtualConfig {
  patternPath?: string;
  sourceAliases?: Record<string, string>;
}

export function getNoteVirtualConfig(app: App, note: TFile): NoteVirtualConfig {
  const cache = app.metadataCache.getFileCache(note);
  const fm = cache?.frontmatter ?? {};
  const patternPath: string | undefined = fm?.virtual_workflow || fm?.virtualPattern || fm?.workflowPattern;
  const sourceAliases: Record<string, string> | undefined = fm?.virtual_sources || fm?.virtualSources;
  return { patternPath, sourceAliases };
}

export async function resolvePatternFile(app: App, note: TFile, patternFolderFallback: string): Promise<TFile | null> {
  const { patternPath } = getNoteVirtualConfig(app, note);
  if (!patternPath) return null;
  const normalized = normalizePath(patternPath, patternFolderFallback);
  const file = app.vault.getAbstractFileByPath(normalized);
  return file instanceof TFile ? file : null;
}

export async function readPattern(app: App, file: TFile): Promise<VirtualPattern | null> {
  try {
    const content = await app.vault.read(file);
    const yaml = parseYaml(content);
    if (!yaml || !yaml.variants) return null;
    return yaml as VirtualPattern;
  } catch (_) {
    return null;
  }
}

function normalizePath(p: string, fallbackFolder: string): string {
  const trimmed = p.trim();
  if (trimmed.endsWith(".yml") || trimmed.endsWith(".yaml") || trimmed.endsWith(".md")) {
    return trimmed;
  }
  return `${fallbackFolder}/${trimmed}.yml`;
}
