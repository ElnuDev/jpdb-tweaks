const storage = "browser" in window ? browser.storage : chrome.storage;

let themes;
let themeSelect;

function setThemeSelectValue(value) {
	themeSelect.value = value;
	themeSelect.querySelector("option[value='']").hidden = value !== "";
}

async function applyThemeToSelect() {
	outer: for (const [theme, parameters] of Object.entries(themes)) {
		for (const [parameter, color] of Object.entries(parameters)) {
			const key = `style.${parameter}`;
			if ((await storage.sync.get(key))[key] !== color) continue outer;
		}
		setThemeSelectValue(theme);
		return;
	}
	setThemeSelectValue("");
}

async function loadState() {
	const defaultTheme = "everforest";
	const defaults = {
		"copy.enabled": true,
		"copy.bold": true,
		"copy.english": true,
		"copy.blockquote": true,
		"image.enabled": false,
		"style.enabled": false,
	};
	const optionDefaults = {
		...defaults,
		...Object.fromEntries(
			Object
				.entries(themes[defaultTheme])
				.map(([key, value]) => [`style.${key}`, value])
		)
	};

	const options = await storage.sync.get();

	await storage.sync.set(Object.fromEntries(Object.entries(optionDefaults).filter(([key, _]) => !(key in options))));
	for (const [key, value] of Object.entries({ ...optionDefaults, ...options })) {
		if (!(key in optionDefaults)) {
			storage.sync.remove(key).then(() => {});
		}
		const elements = document.body.querySelectorAll(`[name="${key}"]`);
		const apply = typeof value === "boolean" ? el => el.checked = value : el => el.value = value;
		elements.forEach(apply);
	}
	applyThemeToSelect().then(() => { });
}

function setStateKey(key, value) {
	storage.sync.set({ [key]: value });
}

document.addEventListener("DOMContentLoaded", () => {
	themeSelect = document.getElementById("style.theme");
	document.getElementById("restoreDefaults").addEventListener("click", () => {
		if (confirm("Are you sure you want to restore all settings to their defaults? This cannot be undone."))
			storage.sync.clear().then(() => loadState().then(() => { }));
	});
	fetch(browser.runtime.getURL("themes.json"))
		.then(response => response.json())
		.then(json => themes = json)
		.then(() => {
			[...document.querySelectorAll("[name]")].forEach(el => {
				el.addEventListener(
					"change",
					() => {
						setStateKey(el.name, el.matches("input[type=checkbox]") ? el.checked : el.value);
						if (themeSelect.value && el.name.startsWith("style.") && themes[themeSelect.value][el.name.slice(6)] !== el.value) {
							setThemeSelectValue("");
						}
					}
				);
			});

			themeSelect.addEventListener("change", () => {
				if (!themeSelect.value) return;
				for (const [key, value] of Object.entries(themes[themeSelect.value])) {
					try {
						const themeParameter = document.querySelector(`[name="style.${key}"]`);
						themeParameter.value = value;
						themeParameter.dispatchEvent(new Event("change"));
					} catch {
						console.error(`no color selector for theme parameter ${key}!`);
					}
				}
			});
			for (const key in themes) {
				const option = document.createElement("option");
				option.value = key;
				option.innerText = key;
				themeSelect.appendChild(option);
			}
			const customOption = document.createElement("option");
			customOption.value = "";
			customOption.innerText = "custom";
			themeSelect.appendChild(customOption);

			// Make sure state remains synced if multiple options windows are open
			loadState().then(() => { });
			setInterval(() => loadState().then(() => { }), 1000);
		});
});
