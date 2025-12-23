import { ItemView, MarkdownRenderer, WorkspaceLeaf } from "obsidian";
import type MyPlugin from "../main";
import type { AssembledVariant } from "./types";

export const VIEW_TYPE_VIRTUAL_NOTE = "virtual-note-view";

export class VirtualNoteView extends ItemView {
  private plugin: MyPlugin;
  private variant: AssembledVariant | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_VIRTUAL_NOTE;
  }

  getDisplayText() {
    return this.variant?.name ?? this.variant?.id ?? "Virtual Note";
  }

  getIcon() {
    return "document";
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.contentEl.empty();
    this.variant = null;
  }

  async setVariant(v: AssembledVariant) {
    this.variant = v;
    await this.render();
  }

  async render() {
    const { contentEl } = this;
    contentEl.empty();
    if (!this.variant) return;
    await MarkdownRenderer.renderMarkdown(this.variant.markdown, contentEl, "", this);
  }
}
