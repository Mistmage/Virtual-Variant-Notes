import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export type OutputMode = "separate" | "single";

export interface MyPluginSettings {
    patternFolder: string;
    defaultMode: OutputMode;
    autoUpdate: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
    patternFolder: "Patterns",
    defaultMode: "separate",
    autoUpdate: false,
};

export class SampleSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Pattern folder")
            .setDesc("Folder where workflow pattern YAML files live")
            .addText((text) =>
                text
                    .setPlaceholder("Patterns")
                    .setValue(this.plugin.settings.patternFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.patternFolder = value.trim() || "Patterns";
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Default mode")
            .setDesc("View as separate virtual notes or single note variants")
            .addDropdown((dd) =>
                dd
                    .addOption("separate", "Separate virtual notes")
                    .addOption("single", "Single note with variants")
                    .setValue(this.plugin.settings.defaultMode)
                    .onChange(async (value: OutputMode) => {
                        this.plugin.settings.defaultMode = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Auto update")
            .setDesc("Regenerate virtual notes when sources change")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.autoUpdate).onChange(async (value) => {
                    this.plugin.settings.autoUpdate = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}
