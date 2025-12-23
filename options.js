const storage = "browser" in window ? browser.storage : chrome.storage;

const defaultTheme = "everforest";
let themes;
let themeSelect;

async function saveTheme() {
	const theme = Object.fromEntries(Object.entries(await storage.sync.get())
		.filter(([key, value]) => key.startsWith("style."))
		.map(([key, value]) => [key.substring(6), value]));

	const fileType = "application/json";

	const date = new Date();
	const fileName = `jpdb-tweaks theme ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.json`;

	const json = JSON.stringify(theme, Object.keys(themes[defaultTheme]), "\t");
	const blob = new Blob([json], { type: fileType });

	const a = document.createElement("a");
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = ["application/json", a.download, a.href].join(":");
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(function () { URL.revokeObjectURL(a.href) }, 1500);
}

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
	{
		const loadInput = document.getElementById("style.loadInput");
		document.getElementById("style.load").addEventListener("click", () => {
			if (document.getElementById('style.theme').value === '' && !confirm('Are you sure you want to overwrite your custom theme? This cannot be undone.')) {
				return;
			}
			loadInput.click();
		});
		loadInput.addEventListener("change", () => {
			const file = loadInput.files[0];
			if (!file) return;
			const reader = new FileReader();
			function handleError(error) { alert(`error loading theme file: ${error}`) }
			reader.onerror = handleError;
			reader.onload = () => {
				try {
					const theme = JSON.parse(reader.result);
					const missingParameters = Object
						.keys(themes[defaultTheme])
						.filter(parameter => !(parameter in theme));
					if (missingParameters.length > 0) {
						handleError(`missing parameter${missingParameters.length === 1 ? "" : "s"} ${missingParameters.join(", ")}`);
						return;
					}
					for (const [parameter, color] of Object.entries(theme)) {
						if (!CSS.supports("color", color)) {
							handleError(`parameter ${parameter} has invalid color value "${color}"`)
							return;
						}
					}
					for (const [parameter, color] of Object.entries(theme)) {
						const colorInput = document.querySelector(`input[name="style.${parameter}"]`);
						colorInput.value = color;
						colorInput.dispatchEvent(new Event("change"));
					}
				} catch(error) {
					console.error(error);
					handleError(error);
				}
			}
			reader.readAsText(file);
		});
	}
	document.getElementById("style.save").onclick = saveTheme;
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
