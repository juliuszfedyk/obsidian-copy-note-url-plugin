import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface CopyNoteUrlPluginSettings {
	extension: string;
	prefix: string;
	showRibbonIcon: boolean;
}

const DEFAULT_SETTINGS: CopyNoteUrlPluginSettings = {
	extension: "md",
	prefix: "",
	showRibbonIcon: false,
};

export default class CopyNoteUrlPlugin extends Plugin {
	settings: CopyNoteUrlPluginSettings;

	private getUrl() {
		const workspace = this.app.workspace;
		const view = workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		const { extension, prefix } = this.settings;
		const url = prefix + view.file.path;

		// Don't change urls for non-markdown files
		if (view.file.extension !== "md") return url;

		if (extension === "md") return url;
		if (extension === "") return url.slice(0, -3);
		return url.slice(0, -3) + "." + extension;
	}

	private async geturlCommandHandler() {
		const url = this.getUrl();
		if (url) {
			await navigator.clipboard.writeText(url);
			new Notice("URL copied!");
			return;
		}
		new Notice("Open a note first.");
	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon(
			"external-link",
			"Copy note URL",
			(evt: MouseEvent) => {
				this.geturlCommandHandler();
			}
		);

		this.addCommand({
			id: "copy-note-url",
			name: "Copy Note Url",
			callback: async () => {
				await this.geturlCommandHandler();
			},
		});

		this.addSettingTab(new CopyNoteUrlPluginSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CopyNoteUrlPluginSettingTab extends PluginSettingTab {
	plugin: CopyNoteUrlPlugin;

	constructor(app: App, plugin: CopyNoteUrlPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Copy Note URL Settings" });
		containerEl.createEl("p", {
			text: "This plugin is usefull when you publish your notes in some custom way. Like using a pure GitHub repo and just reading the notes as files in the repository. It will combine whatever you put in prefix with the path of the note within obsidian vault.",
		});

		new Setting(containerEl)
			.setName("Prefix")
			.setDesc(
				'Eveyrthing in your url, that goes before the path of the note in obsidian. Include the trailing "/"'
			)
			.addText((text) =>
				text
					.setPlaceholder(
						"https://github.com/something/something/blob/"
					)
					.setValue(this.plugin.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("File extension")
			.setDesc(
				"Should the url end with .md .html or none? (note that it will not change extension for non markdown files)."
			)
			.addDropdown((cb) =>
				cb
					.addOption("", "none")
					.addOption("md", ".md")
					.addOption("html", ".html")
					.setValue(this.plugin.settings.extension)
					.onChange(async (value) => {
						this.plugin.settings.extension = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
