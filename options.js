const storage = "browser" in window ? browser.storage : chrome.storage;

const optionDefaults = {
	"copy.enabled": true,
	"copy.bold": true,
	"copy.english": true,
	"copy.blockquote": true,
};

async function loadState() {
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
}

function setStateKey(key, value) {
	storage.sync.set({ [key]: value });
}

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("restoreDefaults").addEventListener("click", () => {
		if (confirm("Are you sure you want to restore all settings to their defaults? This cannot be undone."))
			storage.sync.clear().then(() => loadState().then(() => { }));
	});
	[...document.body.querySelectorAll("[name]")]
		.forEach(el => el.addEventListener(
			"change",
			() => setStateKey(el.name, el.matches("input[type=checkbox]") ? el.checked : el.value)
		));
	// Make sure state remains synced if multiple options windows are open
	loadState().then(() => {});
	setInterval(() => loadState().then(() => {}), 1000);
});
