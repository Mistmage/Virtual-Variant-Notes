export interface VirtualPattern {
  name?: string;
  sources?: Record<string, string>;
  variants: VariantSpec[];
}

export interface VariantSpec {
  id: string;
  name?: string;
  assemble: AssemblyStep[];
  frontmatter?: Record<string, unknown>;
}

export interface AssemblyStep {
  source: string; // 'current' or file path or alias defined in pattern.sources or note frontmatter
  include?: IncludeSpec;
}

export interface IncludeSpec {
  headings?: (string | { title: string; depth?: number })[];
  blocks?: string[]; // block ids without leading ^
  sections?: string[]; // heading paths like '# Heading'
  frontmatter?: string[]; // keys to copy from source frontmatter
  all?: boolean; // include entire file body (excluding frontmatter)
}

export interface AssembledVariant {
  id: string;
  name?: string;
  frontmatter: Record<string, unknown>;
  markdown: string;
}
