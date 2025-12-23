import { App, TFile, parseYaml } from "obsidian";
import { VirtualPattern } from "./types";

export interface NoteVirtualConfig {
  patternPath?: string;
  sourceAliases?: Record<string, string>;
}

export function getNoteVirtualConfig(app: App, note: TFile): NoteVirtualConfig {
  const cache = app.metadataCache.getFileCache(note);
  const fm = cache?.frontmatter ?? {};
  const patternPath: string | undefined =
    (fm as Record<string, unknown>)?.["virtual_workflow"] as string ||
    (fm as Record<string, unknown>)?.["virtualPattern"] as string ||
    (fm as Record<string, unknown>)?.["workflowPattern"] as string;
  const sourceAliases: Record<string, string> | undefined =
    (fm as Record<string, unknown>)?.["virtual_sources"] as Record<string, string> ||
    (fm as Record<string, unknown>)?.["virtualSources"] as Record<string, string>;
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
    const yamlUnknown = parseYaml(content) as unknown;
    if (!isVirtualPattern(yamlUnknown)) return null;
    return yamlUnknown;
  } catch {
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

function isVirtualPattern(x: unknown): x is VirtualPattern {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  const variants = obj["variants"];
  if (!Array.isArray(variants)) return false;
  return true;
}
