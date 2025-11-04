const storage = "browser" in window ? browser.storage : chrome.storage;

async function loadState() {
	console.log("we're loading!");
	for (const [key, value] of Object.entries(await storage.sync.get())) {
		const elements = document.body.querySelectorAll(`[name=${key}]`);
		const apply = typeof value === "boolean" ? el => el.checked = value : el => el.value = value;
		elements.forEach(apply);
	}
}

function setStateKey(key, value) {
	storage.sync.set({ [key]: value });
}

document.addEventListener("DOMContentLoaded", () => {
	[...document.body.querySelectorAll("[name]")]
		.forEach(el => el.addEventListener(
			"change",
			() => setStateKey(el.name, el.matches("input[type=checkbox]") ? el.checked : el.value)
		));
	// Make sure state remains synced if multiple options windows are open
	loadState().then(() => {});
	setInterval(() => loadState().then(() => {}), 1000);
});
