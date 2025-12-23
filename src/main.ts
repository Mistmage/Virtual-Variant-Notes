import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, VirtualVariantPluginSettings, VirtualVariantSettingsTab } from "./settings";
import { resolvePatternFile, readPattern, getNoteVirtualConfig } from "./virtual/pattern";
import { assembleVariants } from "./virtual/assembler";
import { VariantPreviewModal } from "./virtual/previewModal";
import { VIEW_TYPE_VIRTUAL_NOTE, VirtualNoteView } from "./virtual/view";

// Remember to rename these classes and interfaces!

export default class VirtualVariantNotesPlugin extends Plugin {
    settings: VirtualVariantPluginSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new VirtualVariantSettingsTab(this.app, this));

        this.registerView(VIEW_TYPE_VIRTUAL_NOTE, (leaf: WorkspaceLeaf) => new VirtualNoteView(leaf, this));

        this.addCommand({
            id: 'virtual-preview-variants',
            name: 'Virtual notes: preview variants',
            checkCallback: (checking) => {
                const md = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!md || !md.file) return false;
                const cfg = getNoteVirtualConfig(this.app, md.file);
                if (!cfg.patternPath) return false;
                if (checking) return true;
                void (async () => {
                    const patFile = await resolvePatternFile(this.app, md.file, this.settings.patternFolder);
                    if (!patFile) return;
                    const pattern = await readPattern(this.app, patFile);
                    if (!pattern) return;
                    const variants = await assembleVariants(this.app, md.file, pattern, cfg.sourceAliases);
                    new VariantPreviewModal(this.app, variants, this).open();
                })();
                return true;
            }
        });

        this.addCommand({
            id: 'virtual-open-first-variant',
            name: 'Virtual notes: open first variant',
            checkCallback: (checking) => {
                const md = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!md || !md.file) return false;
                const cfg = getNoteVirtualConfig(this.app, md.file);
                if (!cfg.patternPath) return false;
                if (checking) return true;
                void (async () => {
                    const patFile = await resolvePatternFile(this.app, md.file, this.settings.patternFolder);
                    if (!patFile) return;
                    const pattern = await readPattern(this.app, patFile);
                    if (!pattern) return;
                    const variants = await assembleVariants(this.app, md.file, pattern, cfg.sourceAliases);
                    if (!variants.length) return;
                    await this.openVirtualVariant(variants[0]);
                })();
                return true;
            }
        });

        if (this.settings.autoUpdate) {
            this.registerEvent(this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    const patFile = await resolvePatternFile(this.app, file, this.settings.patternFolder);
                    if (patFile) {
                        const pattern = await readPattern(this.app, patFile);
                        if (pattern) {
                            // No file generation; optionally refresh any open virtual views
                            // In a fuller implementation we would track open virtual views and re-render them.
                        }
                    }
                }
            }));
        }
    }

	onunload() {
	}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<VirtualVariantPluginSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private async withActiveNote<T>(fn: (file: TFile) => Promise<T | boolean>) {
        const md = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!md || !md.file) return false;
        return await fn(md.file);
    }

    async openVirtualVariant(variant: { id: string; markdown: string; name?: string }) {
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.setViewState({ type: VIEW_TYPE_VIRTUAL_NOTE, state: {} });
        const view = leaf.view as VirtualNoteView;
        await view.setVariant({ id: variant.id, markdown: variant.markdown, name: variant.name, frontmatter: {} });
        void this.app.workspace.revealLeaf(leaf);
    }
}

// No file system helpers needed for virtual-only notes.
