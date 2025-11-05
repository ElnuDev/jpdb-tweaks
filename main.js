const storage = "browser" in window ? browser.storage : chrome.storage;

storage.sync.get().then(options => {
	if (options["copy.enabled"]) copy(options);
});

function copy({ "copy.bold": bold, "copy.english": english, "copy.blockquote": blockquote }) {
	function markdown(parent) {
		let md = "";
		for (const child of parent.childNodes) {
			if (child.nodeType == Node.TEXT_NODE) {
				md += child.textContent;
			} else if (child.nodeType == Node.ELEMENT_NODE) {
				if (child.classList.contains("highlight")) {
					const childMd = markdown(child);
					if (bold) md += `\\ **${markdown(child)}**\\ `
					else md += childMd;
				} else {
					const kanji = child.childNodes[0].textContent;
					const furigana = child.childNodes[1].textContent;
					md += `[${kanji}]{${furigana}}`;
				}
			}
		}
		return md;
	}

	function exampleMarkdown(example) {
		let md = "";
		const jp = example.querySelector(".jp");
		if (jp) {
			if (blockquote) md += "> ";
			md += markdown(jp);
		}
		if (english) {
			const en = example.querySelector(".en");
			if (en) {
				md += "\n";
				if (blockquote) md += "> ";
				else md += "\n";
				md += en.innerHTML.trim();
			}
		}
		return md;
	}

	const examples = document.querySelectorAll(".subsection-examples > .subsection > *:not(.more)");
	for (const example of examples) {
		example.style.display = "flex";
		const md = exampleMarkdown(example);
		const button = document.createElement("button");
		example.appendChild(button);
		const width = "2em";
		const resetIcon = () => button.innerHTML = `<svg style="width: ${width}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" /></svg>`;
		resetIcon();
		button.style = "margin-left: auto; padding: 0; line-height: 0; aspect-ratio: 1; display: block"
		button.addEventListener("click", () => {
			navigator.clipboard.writeText(md);
			button.innerHTML = `<svg style="width: ${width}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`;
			setTimeout(resetIcon, 1000);
		});
	}
}
