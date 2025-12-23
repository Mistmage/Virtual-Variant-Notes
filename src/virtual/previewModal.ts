import { App, MarkdownRenderer, Modal } from "obsidian";
import { AssembledVariant } from "./types";
import type VirtualVariantNotesPlugin from "../main";

export class VariantPreviewModal extends Modal {
  private variants: AssembledVariant[];
  private currentIndex = 0;
  private plugin?: VirtualVariantNotesPlugin;

  constructor(app: App, variants: AssembledVariant[], plugin?: VirtualVariantNotesPlugin) {
    super(app);
    this.variants = variants;
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createDiv({ cls: "virtual-variants-header" });
    const select = header.createEl("select");
    this.variants.forEach((v, i) => {
      const opt = select.createEl("option", { text: v.name ?? v.id });
      opt.value = String(i);
    });
    select.value = String(this.currentIndex);

    const body = contentEl.createDiv({ cls: "virtual-variant-body" });
    const render = async () => {
      body.empty();
      const v = this.variants[this.currentIndex];
      await MarkdownRenderer.render(v.markdown, body, "", this);
    };

    select.onchange = async () => {
      this.currentIndex = Number(select.value);
      await render();
    };

    if (this.plugin) {
      const actions = contentEl.createDiv({ cls: "virtual-variants-actions" });
      const btn = actions.createEl("button", { text: "Open as virtual note" });
      btn.onclick = async () => {
        const v = this.variants[this.currentIndex];
        // Delegate to plugin to open a leaf with the virtual note view
        // @ts-ignore
        await this.plugin?.openVirtualVariant(v);
        this.close();
      };
    }

    await render();
  }

  onClose() {
    this.contentEl.empty();
  }
}
