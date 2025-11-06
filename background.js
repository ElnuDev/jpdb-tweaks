const browser = "browser" in this ? browser : chrome;

browser.runtime.onInstalled.addListener(() => {
	browser.tabs.create({ url: browser.runtime.getURL("options.html") });
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log(`https://www.bing.com/images/search?q=${request.query}`);
	fetch(`https://www.bing.com/images/search?q=${request.query}`)
		.then(response => response.text())
		.then(text => {
			// DOMParser isn't a thing in service worker contexts,
			// so we'll have to make do with a plain regular expression.
			/*
			const dom = (new DOMParser()).parseFromString(text);
			const images = [...dom.querySelectorAll("img.mimg")]
				.map(img => img.src)
				.filter(src => src.startsWith("http"));
			*/
			console.log([...text.matchAll(/width="(\d+)" src="(https:\/\/th.bing.com\/th[^"]+)"/g)])
			const images = [...text.matchAll(/width="(\d+)" src="(https:\/\/th.bing.com\/th[^"]+)"/g)]
				.filter(match => match[1] !== "42") // width="42" removes the related search query thumbnails
				.map(match => match[2]);
			console.log(images);
			fetch(images[0])
				// For some reason the client receives array buffers as {},
				// so even though they're slower (conversion to base64 string),
				// we're sending a blob instead.
				.then(response => response.blob())
				.then(blob => {
					const reader = new FileReader();
					reader.readAsDataURL(blob);
					reader.addEventListener("load", () => sendResponse(reader.result));
				});
		});
	// indicate to the listener that we have an async response processing
	return true;
});
