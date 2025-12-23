import { App, MarkdownView, Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { resolvePatternFile, readPattern, getNoteVirtualConfig } from "./virtual/pattern";
import { assembleVariants } from "./virtual/assembler";
import { VariantPreviewModal } from "./virtual/previewModal";
import { VIEW_TYPE_VIRTUAL_NOTE, VirtualNoteView } from "./virtual/view";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SampleSettingTab(this.app, this));

        this.registerView(VIEW_TYPE_VIRTUAL_NOTE, (leaf: WorkspaceLeaf) => new VirtualNoteView(leaf, this));

        this.addCommand({
            id: 'virtual-preview-variants',
            name: 'Virtual notes: Preview variants',
            checkCallback: (checking) => this.withActiveNote(async (note) => {
                const patFile = await resolvePatternFile(this.app, note, this.settings.patternFolder);
                if (!patFile) return false;
                if (checking) return true;
                const pattern = await readPattern(this.app, patFile);
                if (!pattern) return false;
                const { sourceAliases } = getNoteVirtualConfig(this.app, note);
                const variants = await assembleVariants(this.app, note, pattern, sourceAliases);
                new VariantPreviewModal(this.app, variants, this).open();
                return true;
            })
        });

        this.addCommand({
            id: 'virtual-open-first-variant',
            name: 'Virtual notes: Open first variant',
            checkCallback: (checking) => this.withActiveNote(async (note) => {
                const patFile = await resolvePatternFile(this.app, note, this.settings.patternFolder);
                if (!patFile) return false;
                if (checking) return true;
                const pattern = await readPattern(this.app, patFile);
                if (!pattern) return false;
                const { sourceAliases } = getNoteVirtualConfig(this.app, note);
                const variants = await assembleVariants(this.app, note, pattern, sourceAliases);
                if (!variants.length) return false;
                await this.openVirtualVariant(variants[0]);
                return true;
            })
        });

        if (this.settings.autoUpdate) {
            this.registerEvent(this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    const patFile = await resolvePatternFile(this.app, file, this.settings.patternFolder);
                    if (patFile) {
                        const pattern = await readPattern(this.app, patFile);
                        if (pattern) {
                            const { sourceAliases } = getNoteVirtualConfig(this.app, file);
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
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
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
        this.app.workspace.revealLeaf(leaf);
    }
}

// No file system helpers needed for virtual-only notes.
